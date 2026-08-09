import { Request, Response } from 'express';
import Channel from '../models/Channel.model';
import User from '../models/User.model';
import ChatMessage from '../models/ChatMessage.model';
import { ApiResponse } from '../types';

const NON_TEAM_MEMBER_ROLES = ['hr_manager', 'super_admin', 'team_manager'];

const getTeamMembershipIds = async (user: any, organizationId: string): Promise<string[]> => {
  const userId = user._id.toString();
  const userName = user.name ? user.name.toString().trim() : '';
  const userRole = user.role ? user.role.toString() : '';
  const isTeamManager = userRole === 'team_manager';

  const userManagerRaw = user.manager;
  const userManager = userManagerRaw ? userManagerRaw.toString().trim() : '';

  const userIds: Set<string> = new Set([userId]);

  if (isTeamManager) {
    const directReports = await User.find({
      organizationId,
      role: { $nin: NON_TEAM_MEMBER_ROLES },
      $or: [
        { manager: userName },
        { manager: userId },
      ],
    }).select('_id');
    directReports.forEach(m => userIds.add(m._id.toString()));
  } else if (userManager) {
    const peersAndMgr: any[] = [];

    const peers = await User.find({
      organizationId,
      role: { $nin: NON_TEAM_MEMBER_ROLES },
      $or: [
        { manager: userManager },
        { manager: userManager.toString() },
      ],
    }).select('_id');
    peers.forEach(m => peersAndMgr.push(m._id.toString()));

    const managerDoc = await User.findOne({
      organizationId,
      role: { $in: ['team_manager'] },
      $or: [
        { name: userManager },
        { _id: userManager },
      ],
    }).select('_id');
    if (managerDoc) peersAndMgr.push(managerDoc._id.toString());

    peersAndMgr.forEach(id => userIds.add(id));
  } else {
    const directReports = await User.find({
      organizationId,
      role: { $nin: NON_TEAM_MEMBER_ROLES },
      $or: [
        { manager: userName },
        { manager: userId },
      ],
    }).select('_id');
    directReports.forEach(m => userIds.add(m._id.toString()));
  }

  return Array.from(userIds);
};

const isUserInMyTeam = async (currentUser: any, targetUserId: string, organizationId: string): Promise<boolean> => {
  const teamIds = await getTeamMembershipIds(currentUser, organizationId);
  return teamIds.includes(targetUserId.toString());
};

const isTeamChannelMine = (teamChannelIdentifier: string, channel: any): boolean => {
  const channelTeamId = channel.teamId ? channel.teamId.toString() : '';
  if (!channelTeamId) return false;
  return channelTeamId === teamChannelIdentifier;
};

export const getChannels = async (req: Request, res: Response<ApiResponse>) => {
  try {
    console.log('getChannels called');

    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (currentUser.role === 'hr_manager' || currentUser.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Chat access not allowed for HR/Administrator users',
      });
    }

    const userName = currentUser.name ? currentUser.name.toString().trim() : '';
    const userRole = currentUser.role ? currentUser.role.toString() : '';
    const isTeamManager = userRole === 'team_manager';
    let userManager = currentUser.manager ? currentUser.manager.toString().trim() : '';

    if (isTeamManager) userManager = '';
    const teamChannelIdentifier = userManager ? `mgr:${userManager}` : `self:${currentUser._id.toString()}`;
    const teamUserIds = await getTeamMembershipIds(currentUser, req.organizationId as string);
    const validTeamSet = new Set(teamUserIds);

    const allTeamChannels = await Channel.find({
      organizationId: req.organizationId,
      type: 'team',
      participants: userId,
    }).populate('participants', 'name email avatar');

    let teamChannel: any = allTeamChannels.find((ch: any) => isTeamChannelMine(teamChannelIdentifier, ch));

    if (!teamChannel) {
      teamChannel = await Channel.create({
        name: 'Team Chat',
        type: 'team',
        organizationId: req.organizationId,
        teamId: teamChannelIdentifier,
        participants: teamUserIds,
        description: 'Team group chat',
        createdBy: userId,
      });
      await teamChannel.populate('participants', 'name email avatar');
    } else {
      const existingIds = new Set(teamChannel.participants.map((p: any) => p._id?.toString() || p.toString()));
      let needsUpdate = false;

      for (const uid of teamUserIds) {
        if (!existingIds.has(uid)) {
          (teamChannel.participants as any[]).push(uid as any);
          needsUpdate = true;
        }
      }

      const cleanedParticipants = (teamChannel.participants as any[]).filter((p: any) => {
        const idStr = p._id?.toString() || p.toString();
        return validTeamSet.has(idStr);
      });
      if (cleanedParticipants.length !== teamChannel.participants.length) {
        teamChannel.participants = cleanedParticipants as any;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await teamChannel.save();
        await teamChannel.populate('participants', 'name email avatar');
      }
    }

    const directChannelsRaw = await Channel.find({
      organizationId: req.organizationId,
      type: 'direct',
      participants: userId,
    }).populate('participants', 'name email avatar');

    const directChannels = directChannelsRaw.filter((ch: any) => {
      const other = ch.participants.find((p: any) => (p._id?.toString() || p.toString()) !== userId);
      if (!other) return false;
      const otherId = other._id?.toString() || other.toString();
      return teamUserIds.includes(otherId);
    });

    const channels = [teamChannel, ...directChannels];

    res.json({
      success: true,
      data: channels,
    });
  } catch (error) {
    console.error('Get Channels Error:', error);
    res.json({
      success: true,
      data: [],
    });
  }
};

export const getTeamMembers = async (req: Request, res: Response<ApiResponse>) => {
  try {
    console.log('getTeamMembers called');

    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (currentUser.role === 'hr_manager' || currentUser.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Chat access not allowed for HR/Administrator users',
      });
    }

    const teamIds = await getTeamMembershipIds(currentUser, req.organizationId as string);
    const filteredIds = teamIds.filter(id => id !== userId);

    let members: any[] = [];
    if (filteredIds.length > 0) {
      members = await User.find({
        _id: { $in: filteredIds },
        organizationId: req.organizationId,
        role: { $nin: NON_TEAM_MEMBER_ROLES },
        department: { $ne: 'Administration' },
      });
    }

    res.json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error('Get Team Members Error:', error);
    res.json({
      success: true,
      data: [],
    });
  }
};

export const getOrCreateDirectChannel = async (req: Request, res: Response<ApiResponse>) => {
  try {
    console.log('getOrCreateDirectChannel');

    const userId = req.headers['x-user-id'] as string;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Target user ID is required',
      });
    }

    if (userId === targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create a direct chat with yourself',
      });
    }

    const currentUser = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (targetUser.role === 'hr_manager' || targetUser.role === 'super_admin' || targetUser.role === 'team_manager') {
      return res.status(403).json({
        success: false,
        message: 'Cannot chat with HR/Administrator users or other Team Managers directly',
      });
    }

    const inTeam = await isUserInMyTeam(currentUser, targetUserId.toString(), req.organizationId as string);
    if (!inTeam) {
      return res.status(403).json({
        success: false,
        message: 'You can only chat with members of your team',
      });
    }

    let channel = await Channel.findOne({
      organizationId: req.organizationId,
      type: 'direct',
      participants: { $all: [userId, targetUserId] },
    }).populate('participants', 'name email avatar');

    if (!channel) {
      channel = await Channel.create({
        name: 'Direct Chat',
        type: 'direct',
        organizationId: req.organizationId,
        participants: [userId, targetUserId],
        createdBy: userId,
      });
      await channel.populate('participants', 'name email avatar');
    }

    res.json({
      success: true,
      data: channel,
    });
  } catch (error) {
    console.error('Get/Create DM Channel Error:', error);
    res.status(500).json({
      success: false,
      message: 'Could not create DM channel',
    });
  }
};

export const getChannel = async (req: Request, res: Response<ApiResponse>) => {
  try {
    console.log('getChannel called for ID:', req.params.channelId);

    const { channelId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    const channel = await Channel.findById(channelId)
      .populate('participants', 'name email avatar');

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }

    const isParticipant = channel.participants.some(
      (p: any) => (p._id?.toString() || p.toString()) === userId
    );
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this channel',
      });
    }

    const currentUser = await User.findById(userId);
    if (currentUser) {
      const teamIds = await getTeamMembershipIds(currentUser, req.organizationId as string);
      if (channel.type === 'team') {
        const validTeamSet = new Set(teamIds);
        const allInTeam = channel.participants.every((p: any) => {
          const idStr = p._id?.toString() || p.toString();
          return validTeamSet.has(idStr);
        });
        if (!allInTeam) {
          return res.status(403).json({
            success: false,
            message: 'You do not have access to this channel',
          });
        }
      } else if (channel.type === 'direct') {
        const other = channel.participants.find((p: any) => (p._id?.toString() || p.toString()) !== userId);
        const otherId = other ? (other._id?.toString() || other.toString()) : '';
        if (otherId && !teamIds.includes(otherId)) {
          return res.status(403).json({
            success: false,
            message: 'You do not have access to this channel',
          });
        }
      }
    }

    const messages = await ChatMessage.find({
      channelId,
      isDeleted: false,
      organizationId: req.organizationId,
    })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: {
        channel,
        messages,
      },
    });
  } catch (error) {
    console.error('Get Channel Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
