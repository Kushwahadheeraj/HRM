require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./dist/models/User.model').default;
const Channel = require('./dist/models/Channel.model').default;
const ChatMessage = require('./dist/models/ChatMessage.model').default;

function safeStr(x, d='') {
  return x == null ? d : (typeof x === 'string' ? x : x.toString ? x.toString() : d);
}

function getChannelIdent(user) {
  const userId = user._id.toString();
  const userName = safeStr(user.name).trim();
  const userRole = safeStr(user.role);
  const isTeamManager = userRole === 'team_manager';
  const userManager = safeStr(user.manager).trim();

  if (isTeamManager) {
    return { ident: 'self:' + userId, mode: 'team_manager_head' };
  } else if (userManager) {
    return { ident: 'mgr:' + userManager, mode: 'employee_of_mgr_name', managerName: userManager };
  } else {
    return { ident: 'self:' + userId, mode: 'employee_no_manager' };
  }
}

function collectTeamUserIds(user, allUsersById, allUsersByName) {
  const team = new Set([user._id.toString()]);
  const ident = getChannelIdent(user);

  if (ident.mode === 'team_manager_head') {
    for (const u of allUsersById.values()) {
      const uId = u._id.toString();
      if (uId === user._id.toString()) continue;
      const r = safeStr(u.role);
      if (r === 'hr_manager' || r === 'super_admin' || r === 'team_manager') continue;
      const m = safeStr(u.manager).trim();
      if (m === safeStr(user.name).trim() || m === user._id.toString()) {
        team.add(uId);
      }
    }
  } else if (ident.mode === 'employee_of_mgr_name') {
    const mgrName = ident.managerName;
    const mgr = allUsersByName.get(mgrName);
    if (mgr && safeStr(mgr.role) === 'team_manager') team.add(mgr._id.toString());
    for (const u of allUsersById.values()) {
      const uId = u._id.toString();
      if (uId === user._id.toString()) continue;
      const r = safeStr(u.role);
      if (r === 'hr_manager' || r === 'super_admin' || r === 'team_manager') continue;
      const m = safeStr(u.manager).trim();
      if (m === mgrName) team.add(uId);
    }
  }

  return Array.from(team);
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/traxale-hrm');

    const allUsers = await User.find({});
    const allUsersById = new Map(allUsers.map(u => [u._id.toString(), u]));
    const allUsersByName = new Map();
    for (const u of allUsers) {
      const nm = safeStr(u.name).trim();
      if (nm) allUsersByName.set(nm, u);
    }

    console.log('\n===== MESSAGES BREAKDOWN (before fix) =====');
    const msgs = await ChatMessage.find({}).populate('userId', 'name');
    const byChannel = new Map();
    for (const m of msgs) {
      const cid = safeStr(m.channelId);
      if (!byChannel.has(cid)) byChannel.set(cid, []);
      byChannel.get(cid).push(m);
    }
    for (const [cid, list] of byChannel) {
      console.log('\nChannel ' + cid + ': ' + list.length + ' messages');
      for (const m of list) {
        const u = m.userId ? safeStr(m.userId.name, '?') : '?';
        const txt = safeStr(m.text).substring(0, 80);
        console.log('  [' + safeStr(m.createdAt).substring(0,24) + '] ' + u + ': ' + txt);
      }
    }

    console.log('\n===== COMPUTED CORRECT TEAM STRUCTURE =====');
    const managerChannels = new Map();
    for (const u of allUsers) {
      const r = safeStr(u.role);
      if (r === 'hr_manager' || r === 'super_admin') continue;
      const ident = getChannelIdent(u);
      const teamIds = collectTeamUserIds(u, allUsersById, allUsersByName);
      console.log('\nUser: ' + safeStr(u.name) + ' [' + r + ']');
      console.log('  Channel ident: ' + ident.ident + ' (' + ident.mode + ')');
      console.log('  Team (' + teamIds.length + '): ' + teamIds.map(id => {
        const uu = allUsersById.get(id);
        return (uu ? safeStr(uu.name) : id) + '[' + (uu ? safeStr(uu.role,'?') : '?') + ']';
      }).join(', '));

      if (ident.mode === 'team_manager_head') {
        if (!managerChannels.has(ident.ident)) {
          managerChannels.set(ident.ident, {
            ident: ident.ident,
            headId: u._id.toString(),
            headName: safeStr(u.name),
            teamIds,
          });
        }
      } else if (ident.mode === 'employee_of_mgr_name') {
        const mgrObj = allUsersByName.get(ident.managerName);
        if (mgrObj && safeStr(mgrObj.role) === 'team_manager') {
          const mgrIdent = 'self:' + mgrObj._id.toString();
          if (!managerChannels.has(mgrIdent)) {
            managerChannels.set(mgrIdent, {
              ident: mgrIdent,
              headId: mgrObj._id.toString(),
              headName: safeStr(mgrObj.name),
              teamIds,
            });
          } else {
            const ex = managerChannels.get(mgrIdent);
            for (const id of teamIds) if (!ex.teamIds.includes(id)) ex.teamIds.push(id);
          }
        } else {
          console.log('  !! Manager "' + ident.managerName + '" not team_manager (role=' + (mgrObj ? safeStr(mgrObj.role) : 'not found') + ')');
        }
      }
    }

    console.log('\n===== FINAL CORRECT TEAM CHANNELS =====');
    for (const [ident, info] of managerChannels) {
      console.log('ident=' + ident + '  head=' + info.headName + '  (' + info.teamIds.length + ') ' +
        info.teamIds.map(id => safeStr((allUsersById.get(id) || {}).name) || id).join(', '));
    }

    const orgFallback = (allUsers.find(u => u.organizationId) || {}).organizationId || (await User.findOne({})).organizationId;

    console.log('\n===== ACTION =====');
    console.log('Delete all existing Channel docs. Remap ChatMessages to correct team channels based on sender.');

    await Channel.deleteMany({});
    console.log('Old channels deleted.');

    const createdChannels = [];
    for (const [ident, info] of managerChannels) {
      const ch = await Channel.create({
        name: 'Team Chat',
        type: 'team',
        organizationId: orgFallback,
        teamId: ident,
        participants: info.teamIds,
        description: 'Team group chat',
        createdBy: info.headId,
      });
      createdChannels.push({ ident, info, channel: ch });
      console.log('Created ' + ident + ' channelId=' + ch._id + ' participants_count=' + info.teamIds.length);
    }

    let skipped = 0, moved = 0;
    for (const m of msgs) {
      const senderId = m.userId ? (m.userId._id ? m.userId._id.toString() : safeStr(m.userId)) : '';
      const sender = allUsersById.get(senderId);
      if (!sender) {
        console.log('SKIP unknown sender id=' + senderId);
        skipped++;
        continue;
      }
      const sr = safeStr(sender.role);
      if (sr === 'hr_manager' || sr === 'super_admin') {
        console.log('SKIP HR/Admin ' + safeStr(sender.name) + ': ' + safeStr(m.text).substring(0,50));
        skipped++;
        continue;
      }
      const ident = getChannelIdent(sender).ident;
      const match = createdChannels.find(x => x.ident === ident);
      if (!match) {
        console.log('SKIP no channel for ' + safeStr(sender.name) + ' ident=' + ident + ' (probably employee with no manager, solo)');
        skipped++;
        continue;
      }
      moved++;
      m.channelId = match.channel._id;
      m.organizationId = m.organizationId || orgFallback;
      await m.save();
    }
    console.log('\nMessages moved: ' + moved + ', skipped: ' + skipped);

    console.log('\n===== FINAL STATE =====');
    const finalCh = await Channel.find({}).populate('participants', 'name role');
    for (const ch of finalCh) {
      const cnt = await ChatMessage.countDocuments({ channelId: ch._id });
      console.log('Channel ' + safeStr(ch.teamId,'<none>') + '  p=' + ch.participants.map(p => safeStr(p.name)+'['+safeStr(p.role)+']').join(',') + '  msgs=' + cnt);
    }

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
