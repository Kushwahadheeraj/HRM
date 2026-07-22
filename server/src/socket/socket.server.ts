
import { Server } from 'socket.io';

import ChatMessage
from '../models/ChatMessage.model';

export const initializeSocket = (
  server: any
) => {

  const io = new Server(server, {

    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },

  });

  io.on('connection', (socket) => {

    console.log(
      'Socket Connected'
    );

    socket.on(
      'userOnline',
      (userData) => {

        socket.join(
          userData.userId
        );

        if (
          userData.role ===
          'team_manager'
        ) {

          socket.join(
            `team-${userData.name}`
          );
        }

        if (
          userData.role ===
          'employee'
        ) {

          socket.join(
            `team-${userData.managerName}`
          );
        }
      }
    );

    // PERSONAL MESSAGE
    socket.on(
      'sendPersonalMessage',
      async (data) => {

        try {

          const message =
            await ChatMessage.create({

              from: data.from,

              to: data.to,

              content: data.content,

              isGroup: false,

              read: false,
            });

          const populatedMessage =
            await ChatMessage
              .findById(message._id)
              .populate(
                'from',
                'name'
              );

          io.to(data.to).emit(
            'receiveMessage',
            populatedMessage
          );

          socket.emit(
            'receiveMessage',
            populatedMessage
          );

        } catch (error) {

          console.log(error);
        }
      }
    );

    // GROUP MESSAGE
    socket.on(
      'sendGroupMessage',
      async (data) => {

        try {

          const message =
            await ChatMessage.create({

              from: data.from,

              to: data.roomId,

              content: data.content,

              isGroup: true,

              read: false,
            });

          const populatedMessage =
            await ChatMessage
              .findById(message._id)
              .populate(
                'from',
                'name'
              );

          io.to(data.roomId).emit(
            'receiveMessage',
            populatedMessage
          );

        } catch (error) {

          console.log(error);
        }
      }
    );

    socket.on(
      'disconnect',
      () => {

        console.log(
          'Socket Disconnected'
        );
      }
    );
  });
};

