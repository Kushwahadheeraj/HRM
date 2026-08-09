require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./dist/models/User.model').default;
const Channel = require('./dist/models/Channel.model').default;
const ChatMessage = require('./dist/models/ChatMessage.model').default;

function safeStr(x, d='') {
  return x == null ? d : (typeof x === 'string' ? x : x.toString ? x.toString() : d);
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/traxale-hrm');

    const allUsers = await User.find({});
    const allUsersById = new Map(allUsers.map(u => [u._id.toString(), u]));
    const usersByName = new Map();
    for (const u of allUsers) {
      const nm = safeStr(u.name).trim();
      if (!nm) continue;
      if (!usersByName.has(nm)) usersByName.set(nm, []);
      usersByName.get(nm).push(u);
    }

    for (const [nm, arr] of usersByName) {
      if (arr.length > 1) {
        console.log('DUPLICATE user name: ' + nm);
        for (const u of arr) {
          console.log('   id=' + u._id + '  role=' + safeStr(u.role) + '  created=' + (u.createdAt || 'unknown'));
        }
      }
    }

    const shikhaDoc = (usersByName.get('Shikha') || [])[0];
    const ramlalDoc = (usersByName.get('RamLal') || [])[0];
    if (!shikhaDoc) { console.error('No Shikha user doc found'); process.exit(1); }
    console.log('\nShikha: _id=' + shikhaDoc._id);
    console.log('RamLal: _id=' + (ramlalDoc ? ramlalDoc._id : 'none'));

    const existingCh = await Channel.find({}).sort({ createdAt: -1 });
    for (const ch of existingCh) {
      console.log('Existing channel teamId=' + safeStr(ch.teamId) + '  _id=' + ch._id + '  pIds=' + JSON.stringify(ch.participants.map(x => safeStr(x))));
    }

    const shikhaTeamIdent = 'self:' + shikhaDoc._id.toString();
    let shikhaChannel = await Channel.findOne({ teamId: shikhaTeamIdent }).populate('participants');
    if (!shikhaChannel) {
      console.log('Creating Shikha channel');
      shikhaChannel = await Channel.create({
        name: 'Team Chat',
        type: 'team',
        organizationId: shikhaDoc.organizationId || (await User.findOne({})).organizationId,
        teamId: shikhaTeamIdent,
        participants: ramlalDoc ? [shikhaDoc._id, ramlalDoc._id] : [shikhaDoc._id],
        description: 'Team group chat',
        createdBy: shikhaDoc._id,
      });
    }
    console.log('Shikha team channel _id=' + shikhaChannel._id);

    console.log('\nRemapping all Shikha/RamLal messages -> ' + shikhaChannel._id);
    const moved = await ChatMessage.updateMany(
      { $or: [{ userId: shikhaDoc._id }, (ramlalDoc ? { userId: ramlalDoc._id } : { _id: null })] },
      { $set: { channelId: shikhaChannel._id } }
    );
    console.log('Updated docs: ' + JSON.stringify(moved));

    const ujalaList = usersByName.get('Ujala') || [];
    console.log('\nUjala users count: ' + ujalaList.length);
    if (ujalaList.length >= 1) {
      const primary = ujalaList.sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0))[0];
      console.log('Primary Ujala = _id=' + primary._id);
      const primaryIdent = 'self:' + primary._id;
      let primaryChannel = await Channel.findOne({ teamId: primaryIdent });
      if (!primaryChannel) {
        primaryChannel = await Channel.create({
          name: 'Team Chat',
          type: 'team',
          organizationId: primary.organizationId || (await User.findOne({})).organizationId,
          teamId: primaryIdent,
          participants: [primary._id],
          description: 'Team group chat',
          createdBy: primary._id,
        });
      }
      console.log('Primary Ujala channel: _id=' + primaryChannel._id);
      for (const u of ujalaList) {
        const uid = u._id.toString();
        if (uid === primary._id.toString()) continue;
        const ident = 'self:' + uid;
        const wrongChannel = await Channel.findOne({ teamId: ident });
        if (wrongChannel) {
          console.log('Migrating messages from duplicate Ujala channel id=' + wrongChannel._id + ' -> primary ' + primaryChannel._id);
          const msgsCount = await ChatMessage.countDocuments({ channelId: wrongChannel._id });
          console.log('   msgs in dupe channel: ' + msgsCount);
          const upd = await ChatMessage.updateMany(
            { channelId: wrongChannel._id, userId: primary._id },
            { $set: { channelId: primaryChannel._id } }
          );
          console.log('   migrated: ' + JSON.stringify(upd));
          await Channel.deleteOne({ _id: wrongChannel._id });
          console.log('   deleted wrong channel ' + wrongChannel._id);
        }
      }
      console.log('Moving any other stray Ujala messages to primary channel...');
      const strayUpd = await ChatMessage.updateMany(
        { userId: primary._id },
        { $set: { channelId: primaryChannel._id } }
      );
      console.log('Result: ' + JSON.stringify(strayUpd));
    }

    console.log('\nDELETING any old remaining team channel with teamId that does not match correct ident');
    const allCh = await Channel.find({ type: 'team' });
    for (const ch of allCh) {
      const tid = safeStr(ch.teamId);
      const startsSelf = tid.startsWith('self:');
      const idPart = startsSelf ? tid.substring(5) : '';
      if (startsSelf && idPart) {
        const owner = allUsersById.get(idPart);
        if (!owner) { console.log('DELETE orphan channel with teamId=' + tid); await Channel.deleteOne({_id:ch._id}); continue; }
        const hasParticipant = ch.participants.some(p => safeStr(p) === idPart || (p && p._id && safeStr(p._id) === idPart));
        if (!hasParticipant) { console.log('DELETE channel teamId=' + tid + ' no owner participant'); await Channel.deleteOne({_id:ch._id}); continue; }
      } else if (!tid) {
        console.log('DELETE old legacy channel with no teamId _id=' + ch._id);
        await Channel.deleteOne({ _id: ch._id });
      }
    }

    const allFinalCh = await Channel.find({}).populate('participants', 'name role');
    console.log('\n===== FINAL RESULT =====');
    for (const ch of allFinalCh) {
      const cnt = await ChatMessage.countDocuments({ channelId: ch._id });
      const pList = ch.participants.map(p => safeStr(p.name)+'['+safeStr(p.role)+']').join(', ');
      console.log('teamId=' + safeStr(ch.teamId,'<missing>') + '  p=[' + pList + ']  msgs=' + cnt);
    }
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
