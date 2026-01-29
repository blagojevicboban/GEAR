const workshopParticipants = new Map(); // workshopId -> Map(socketId -> userData)

export const setupSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // --- Multi-User Avatar System (Result 1) ---
        // Using rooms for isolation (Room = `workshop_${workshopId}`)
        socket.on('join-workshop', ({ workshopId, user }) => {
            const roomName = `workshop_${workshopId}`;
            socket.join(roomName);

            // Store in memory map for state tracking (optional but good for 'current-participants')
            if (!workshopParticipants.has(workshopId)) {
                workshopParticipants.set(workshopId, new Map());
            }
            const participants = workshopParticipants.get(workshopId);
            participants.set(socket.id, {
                ...user,
                transforms: {
                    head: {
                        pos: { x: 0, y: 1.6, z: 0 },
                        rot: { x: 0, y: 0, z: 0 },
                    },
                    leftHand: null, // Initial
                    rightHand: null,
                },
            });

            // Broadcast to others in the room
            socket
                .to(roomName)
                .emit('user-joined', { socketId: socket.id, user });

            // Send existing participants to the joiner
            const others = Array.from(participants.entries())
                .filter(([id]) => id !== socket.id)
                .map(([id, data]) => ({ socketId: id, ...data }));

            socket.emit('current-participants', others);

            console.log(`User ${user.username} joined ${roomName}`);
        });

        socket.on('update-transform', ({ workshopId, transforms }) => {
            // Update server state (lightweight)
            const participants = workshopParticipants.get(workshopId);
            if (participants && participants.has(socket.id)) {
                const p = participants.get(socket.id);
                p.transforms = transforms;
            }

            // Broadcast movement to everyone else in the room
            socket.to(`workshop_${workshopId}`).emit('participant-moved', {
                socketId: socket.id,
                transforms,
            });
        });

        socket.on('leave-workshop', ({ workshopId }) => {
            const roomName = `workshop_${workshopId}`;
            socket.leave(roomName);

            const participants = workshopParticipants.get(workshopId);
            if (participants) {
                participants.delete(socket.id);
                if (participants.size === 0) {
                    workshopParticipants.delete(workshopId);
                }
            }

            socket.to(roomName).emit('user-left', { socketId: socket.id });
            console.log(`User left ${roomName}`);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            // Cleanup from all workshops
            workshopParticipants.forEach((participants, workshopId) => {
                if (participants.has(socket.id)) {
                    participants.delete(socket.id);
                    io.to(`workshop_${workshopId}`).emit('user-left', {
                        socketId: socket.id,
                    });
                    if (participants.size === 0) {
                        workshopParticipants.delete(workshopId);
                    }
                }
            });
        });
    });
};
