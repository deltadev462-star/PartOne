import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Generate unique meeting ID
const generateMeetingId = async () => {
    const lastMeeting = await prisma.meeting.findFirst({
        orderBy: { meetingId: 'desc' },
    });
    
    if (!lastMeeting) {
        return 'MTG-001';
    }
    
    const lastNumber = parseInt(lastMeeting.meetingId.split('-')[1]);
    const newNumber = lastNumber + 1;
    return `MTG-${String(newNumber).padStart(3, '0')}`;
};

// Get all meetings
const getMeetings = async (req, res) => {
    try {
        const { 
            projectId, 
            status, 
            meetingType,
            ownerId, 
            fromDate, 
            toDate, 
            search,
            page = 1,
            limit = 10,
            sortBy = 'meetingDate',
            sortOrder = 'asc'
        } = req.query;

        // Build where clause
        const where = {};
        
        if (projectId) {
            where.projectId = projectId === 'global' ? null : projectId;
        }
        
        if (status) {
            where.status = status;
        }
        
        if (meetingType) {
            where.meetingType = meetingType;
        }
        
        if (ownerId) {
            where.ownerId = ownerId;
        }
        
        if (fromDate || toDate) {
            where.meetingDate = {};
            if (fromDate) {
                where.meetingDate.gte = new Date(fromDate);
            }
            if (toDate) {
                where.meetingDate.lte = new Date(toDate);
            }
        }
        
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { agenda: { contains: search, mode: 'insensitive' } },
                { meetingId: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get total count
        const totalCount = await prisma.meeting.count({ where });

        // Get meetings with related data
        const meetings = await prisma.meeting.findMany({
            where,
            skip,
            take: parseInt(limit),
            orderBy: { [sortBy]: sortOrder },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                },
                participants: {
                    include: {
                        stakeholder: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true
                            }
                        }
                    }
                },
                attachments: {
                    select: {
                        id: true,
                        fileName: true,
                        fileUrl: true,
                        type: true,
                        uploadedAt: true
                    }
                },
                _count: {
                    select: {
                        actionTasks: true,
                        signoffs: true
                    }
                }
            }
        });

        res.json({
            meetings,
            pagination: {
                total: totalCount,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(totalCount / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching meetings:', error);
        res.status(500).json({ error: 'Failed to fetch meetings' });
    }
};

// Get a single meeting by ID
const getMeetingById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const meeting = await prisma.meeting.findUnique({
            where: { id },
            include: {
                project: true,
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                },
                momFinalizer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                },
                participants: {
                    include: {
                        stakeholder: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true
                            }
                        }
                    }
                },
                attachments: {
                    include: {
                        uploader: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                actionTasks: {
                    include: {
                        task: {
                            include: {
                                assignee: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        image: true
                                    }
                                }
                            }
                        }
                    }
                },
                signoffs: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                image: true
                            }
                        }
                    }
                },
                requirements: {
                    include: {
                        requirement: true
                    }
                }
            }
        });
        
        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }
        
        res.json(meeting);
    } catch (error) {
        console.error('Error fetching meeting:', error);
        res.status(500).json({ error: 'Failed to fetch meeting' });
    }
};

// Create a new meeting
const createMeeting = async (req, res) => {
    try {
        const {
            projectId,
            title,
            description,
            agenda,
            meetingType,
            meetingDate,
            endDate,
            duration,
            location,
            meetingLink,
            recurrencePattern,
            recurrenceEndDate,
            ownerId,
            participants,
            attachments,
            requirements,
            distributionList
        } = req.body;

        const meetingId = await generateMeetingId();

        // Create meeting with all related data
        const meeting = await prisma.meeting.create({
            data: {
                meetingId,
                projectId,
                title,
                description,
                agenda,
                meetingType: meetingType || 'ONE_TIME',
                meetingDate: new Date(meetingDate),
                endDate: endDate ? new Date(endDate) : null,
                duration,
                location,
                meetingLink,
                recurrencePattern,
                recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null,
                ownerId,
                distributionList: distributionList || [],
                participants: {
                    create: participants?.map(p => ({
                        stakeholderId: p.stakeholderId,
                        userId: p.userId,
                        name: p.name,
                        email: p.email,
                        role: p.role || 'ATTENDEE'
                    })) || []
                },
                attachments: {
                    create: attachments?.map(a => ({
                        fileName: a.fileName,
                        fileUrl: a.fileUrl,
                        fileSize: a.fileSize,
                        mimeType: a.mimeType,
                        type: a.type || 'GENERAL',
                        uploadedBy: a.uploadedBy || ownerId
                    })) || []
                },
                requirements: {
                    create: requirements?.map(r => ({
                        requirementId: r
                    })) || []
                }
            },
            include: {
                project: true,
                owner: true,
                participants: {
                    include: {
                        stakeholder: true,
                        user: true
                    }
                },
                attachments: true,
                requirements: {
                    include: {
                        requirement: true
                    }
                }
            }
        });

        // Handle recurring meetings
        if (meetingType === 'RECURRING' && recurrencePattern && recurrenceEndDate) {
            await createRecurringMeetings(meeting, recurrencePattern, recurrenceEndDate);
        }

        res.status(201).json(meeting);
    } catch (error) {
        console.error('Error creating meeting:', error);
        res.status(500).json({ error: 'Failed to create meeting' });
    }
};

// Update a meeting
const updateMeeting = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Handle participants update separately
        const participants = updateData.participants;
        delete updateData.participants;

        // Handle attachments update separately  
        const attachments = updateData.attachments;
        delete updateData.attachments;

        // Handle requirements update separately
        const requirements = updateData.requirements;
        delete updateData.requirements;

        // Convert date strings to Date objects
        if (updateData.meetingDate) {
            updateData.meetingDate = new Date(updateData.meetingDate);
        }
        if (updateData.endDate) {
            updateData.endDate = new Date(updateData.endDate);
        }
        if (updateData.recurrenceEndDate) {
            updateData.recurrenceEndDate = new Date(updateData.recurrenceEndDate);
        }

        // Update meeting
        const meeting = await prisma.meeting.update({
            where: { id },
            data: updateData
        });

        // Update participants if provided
        if (participants) {
            // Delete existing participants
            await prisma.meetingParticipant.deleteMany({
                where: { meetingId: id }
            });

            // Create new participants
            if (participants.length > 0) {
                await prisma.meetingParticipant.createMany({
                    data: participants.map(p => ({
                        meetingId: id,
                        stakeholderId: p.stakeholderId,
                        userId: p.userId,
                        name: p.name,
                        email: p.email,
                        role: p.role || 'ATTENDEE'
                    }))
                });
            }
        }

        // Update requirements if provided
        if (requirements) {
            // Delete existing requirements
            await prisma.meetingRequirement.deleteMany({
                where: { meetingId: id }
            });

            // Create new requirements
            if (requirements.length > 0) {
                await prisma.meetingRequirement.createMany({
                    data: requirements.map(r => ({
                        meetingId: id,
                        requirementId: r
                    }))
                });
            }
        }

        // Get updated meeting with all relations
        const updatedMeeting = await prisma.meeting.findUnique({
            where: { id },
            include: {
                project: true,
                owner: true,
                participants: {
                    include: {
                        stakeholder: true,
                        user: true
                    }
                },
                attachments: true,
                actionTasks: {
                    include: {
                        task: true
                    }
                },
                requirements: {
                    include: {
                        requirement: true
                    }
                }
            }
        });

        res.json(updatedMeeting);
    } catch (error) {
        console.error('Error updating meeting:', error);
        res.status(500).json({ error: 'Failed to update meeting' });
    }
};

// Delete a meeting
const deleteMeeting = async (req, res) => {
    try {
        const { id } = req.params;
        
        await prisma.meeting.delete({
            where: { id }
        });
        
        res.json({ message: 'Meeting deleted successfully' });
    } catch (error) {
        console.error('Error deleting meeting:', error);
        res.status(500).json({ error: 'Failed to delete meeting' });
    }
};

// Update meeting status
const updateMeetingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const meeting = await prisma.meeting.update({
            where: { id },
            data: { status }
        });

        res.json(meeting);
    } catch (error) {
        console.error('Error updating meeting status:', error);
        res.status(500).json({ error: 'Failed to update meeting status' });
    }
};

// Update MoM (Minutes of Meeting)
const updateMoM = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            momContent,
            discussionPoints,
            decisions,
            actionItems,
            concerns,
            notes,
            momStatus
        } = req.body;

        const meeting = await prisma.meeting.update({
            where: { id },
            data: {
                momContent,
                discussionPoints: discussionPoints || [],
                decisions: decisions || [],
                actionItems: actionItems || [],
                concerns,
                notes,
                momStatus
            }
        });

        res.json(meeting);
    } catch (error) {
        console.error('Error updating MoM:', error);
        res.status(500).json({ error: 'Failed to update MoM' });
    }
};

// Finalize MoM
const finalizeMoM = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        const meeting = await prisma.meeting.update({
            where: { id },
            data: {
                momStatus: 'FINALIZED',
                momFinalizedBy: userId,
                momFinalizedAt: new Date()
            },
            include: {
                momFinalizer: true
            }
        });

        res.json(meeting);
    } catch (error) {
        console.error('Error finalizing MoM:', error);
        res.status(500).json({ error: 'Failed to finalize MoM' });
    }
};

// Distribute MoM
const distributeMoM = async (req, res) => {
    try {
        const { id } = req.params;
        const { emails } = req.body;

        const meeting = await prisma.meeting.update({
            where: { id },
            data: {
                momStatus: 'DISTRIBUTED',
                momDistributedAt: new Date(),
                distributionList: emails || []
            }
        });

        // TODO: Implement email sending logic here
        // Use nodemailer or other email service to send MoM to distribution list

        res.json({ message: 'MoM distributed successfully', meeting });
    } catch (error) {
        console.error('Error distributing MoM:', error);
        res.status(500).json({ error: 'Failed to distribute MoM' });
    }
};

// Mark attendance
const markAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { participantId, attended } = req.body;

        const participant = await prisma.meetingParticipant.update({
            where: { id: participantId },
            data: { attended }
        });

        res.json(participant);
    } catch (error) {
        console.error('Error marking attendance:', error);
        res.status(500).json({ error: 'Failed to mark attendance' });
    }
};

// Add sign-off
const addSignoff = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, signoffType, comments } = req.body;

        const signoff = await prisma.meetingSignoff.create({
            data: {
                meetingId: id,
                userId,
                signoffType: signoffType || 'MOM_APPROVAL',
                comments
            },
            include: {
                user: true
            }
        });

        res.json(signoff);
    } catch (error) {
        console.error('Error adding sign-off:', error);
        res.status(500).json({ error: 'Failed to add sign-off' });
    }
};

// Convert action item to task
const convertActionToTask = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            actionItem,
            projectId,
            title,
            description,
            assigneeId,
            due_date,
            priority
        } = req.body;

        // Create task
        const task = await prisma.task.create({
            data: {
                projectId,
                title,
                description,
                assigneeId,
                due_date: new Date(due_date),
                priority: priority || 'MEDIUM',
                status: 'TODO',
                type: 'TASK'
            }
        });

        // Link task to meeting action item
        const meetingActionTask = await prisma.meetingActionTask.create({
            data: {
                meetingId: id,
                taskId: task.id,
                actionItem
            },
            include: {
                task: true
            }
        });

        res.json(meetingActionTask);
    } catch (error) {
        console.error('Error converting action to task:', error);
        res.status(500).json({ error: 'Failed to convert action item to task' });
    }
};

// Get upcoming meetings
const getUpcomingMeetings = async (req, res) => {
    try {
        const { userId, days = 7 } = req.query;
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + parseInt(days));

        const where = {
            meetingDate: {
                gte: new Date(),
                lte: endDate
            },
            status: {
                in: ['SCHEDULED', 'IN_PROGRESS']
            }
        };

        if (userId) {
            where.OR = [
                { ownerId: userId },
                {
                    participants: {
                        some: {
                            userId
                        }
                    }
                }
            ];
        }

        const meetings = await prisma.meeting.findMany({
            where,
            orderBy: { meetingDate: 'asc' },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        participants: true
                    }
                }
            }
        });

        res.json(meetings);
    } catch (error) {
        console.error('Error fetching upcoming meetings:', error);
        res.status(500).json({ error: 'Failed to fetch upcoming meetings' });
    }
};

// Get meeting calendar data
const getMeetingCalendar = async (req, res) => {
    try {
        const { projectId, month, year } = req.query;
        
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const where = {
            meetingDate: {
                gte: startDate,
                lte: endDate
            }
        };

        if (projectId && projectId !== 'all') {
            where.projectId = projectId === 'global' ? null : projectId;
        }

        const meetings = await prisma.meeting.findMany({
            where,
            select: {
                id: true,
                meetingId: true,
                title: true,
                meetingDate: true,
                endDate: true,
                status: true,
                meetingType: true,
                location: true,
                meetingLink: true,
                project: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                owner: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        res.json(meetings);
    } catch (error) {
        console.error('Error fetching calendar data:', error);
        res.status(500).json({ error: 'Failed to fetch calendar data' });
    }
};

// Helper function to create recurring meetings
const createRecurringMeetings = async (baseMeeting, pattern, endDate) => {
    const meetings = [];
    let currentDate = new Date(baseMeeting.meetingDate);
    const recurEndDate = new Date(endDate);
    
    while (currentDate <= recurEndDate) {
        let nextDate = new Date(currentDate);
        
        switch (pattern) {
            case 'DAILY':
                nextDate.setDate(nextDate.getDate() + 1);
                break;
            case 'WEEKLY':
                nextDate.setDate(nextDate.getDate() + 7);
                break;
            case 'BIWEEKLY':
                nextDate.setDate(nextDate.getDate() + 14);
                break;
            case 'MONTHLY':
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
            case 'QUARTERLY':
                nextDate.setMonth(nextDate.getMonth() + 3);
                break;
        }
        
        if (nextDate > recurEndDate) break;
        
        const meetingId = await generateMeetingId();
        
        meetings.push({
            meetingId,
            projectId: baseMeeting.projectId,
            title: baseMeeting.title,
            description: baseMeeting.description,
            agenda: baseMeeting.agenda,
            meetingType: 'RECURRING',
            status: 'SCHEDULED',
            meetingDate: nextDate,
            endDate: baseMeeting.endDate ? new Date(nextDate.getTime() + (baseMeeting.endDate.getTime() - baseMeeting.meetingDate.getTime())) : null,
            duration: baseMeeting.duration,
            location: baseMeeting.location,
            meetingLink: baseMeeting.meetingLink,
            recurrencePattern: pattern,
            recurrenceEndDate: recurEndDate,
            ownerId: baseMeeting.ownerId,
            distributionList: baseMeeting.distributionList
        });
        
        currentDate = nextDate;
    }
    
    if (meetings.length > 0) {
        await prisma.meeting.createMany({
            data: meetings
        });
    }
};

module.exports = {
    getMeetings,
    getMeetingById,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    updateMeetingStatus,
    updateMoM,
    finalizeMoM,
    distributeMoM,
    markAttendance,
    addSignoff,
    convertActionToTask,
    getUpcomingMeetings,
    getMeetingCalendar
};