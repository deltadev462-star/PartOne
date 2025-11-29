import React, { useState, useEffect, useRef } from 'react';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock,
    MapPin,
    Users,
    Video,
    RefreshCw,
    Grid3x3,
    List,
    CalendarDays,
    Plus,
    Edit,
    Smartphone,
    Menu,
    X
} from 'lucide-react';

const MeetingCalendarView = ({
    meetings,
    selectedDate,
    onDateSelect,
    onMeetingSelect,
    onCreateMeeting,
    viewType = 'month',
    isDark
}) => {
    const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
    const [currentView, setCurrentView] = useState(viewType);
    const [calendarDays, setCalendarDays] = useState([]);
    const [isMobile, setIsMobile] = useState(false);
    const [showViewOptions, setShowViewOptions] = useState(false);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const swipeAreaRef = useRef(null);

    // Minimum swipe distance (in px)
    const minSwipeDistance = 50;

    useEffect(() => {
        generateCalendarDays();
    }, [currentDate, currentView]);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Touch/Swipe handlers
    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;
        
        if (isLeftSwipe) {
            navigateNext();
        }
        if (isRightSwipe) {
            navigatePrevious();
        }
    };

    const generateCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        if (currentView === 'month') {
            // Get first day of month
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            
            // Get the day of week of first day (0 = Sunday)
            const startingDayOfWeek = firstDay.getDay();
            
            // Get previous month's last days
            const prevMonthLastDay = new Date(year, month, 0).getDate();
            
            const days = [];
            
            // Add previous month's days
            for (let i = startingDayOfWeek - 1; i >= 0; i--) {
                days.push({
                    date: new Date(year, month - 1, prevMonthLastDay - i),
                    isCurrentMonth: false
                });
            }
            
            // Add current month's days
            for (let i = 1; i <= lastDay.getDate(); i++) {
                days.push({
                    date: new Date(year, month, i),
                    isCurrentMonth: true
                });
            }
            
            // Add next month's days to fill the grid
            const remainingDays = 42 - days.length; // 6 weeks * 7 days
            for (let i = 1; i <= remainingDays; i++) {
                days.push({
                    date: new Date(year, month + 1, i),
                    isCurrentMonth: false
                });
            }
            
            setCalendarDays(days);
        } else if (currentView === 'week') {
            // Generate week view
            const startOfWeek = new Date(currentDate);
            const dayOfWeek = startOfWeek.getDay();
            startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
            
            const days = [];
            for (let i = 0; i < 7; i++) {
                const date = new Date(startOfWeek);
                date.setDate(startOfWeek.getDate() + i);
                days.push({
                    date,
                    isCurrentMonth: true
                });
            }
            
            setCalendarDays(days);
        } else if (currentView === 'day') {
            // Single day view
            setCalendarDays([{
                date: new Date(currentDate),
                isCurrentMonth: true
            }]);
        }
    };

    const getMeetingsForDate = (date) => {
        if (!meetings) return [];
        
        const dateStr = date.toDateString();
        return meetings.filter(meeting => {
            const meetingDate = new Date(meeting.meetingDate);
            return meetingDate.toDateString() === dateStr;
        });
    };

    const navigatePrevious = () => {
        const newDate = new Date(currentDate);
        
        if (currentView === 'month') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else if (currentView === 'week') {
            newDate.setDate(newDate.getDate() - 7);
        } else if (currentView === 'day') {
            newDate.setDate(newDate.getDate() - 1);
        }
        
        setCurrentDate(newDate);
        onDateSelect(newDate);
    };

    const navigateNext = () => {
        const newDate = new Date(currentDate);
        
        if (currentView === 'month') {
            newDate.setMonth(newDate.getMonth() + 1);
        } else if (currentView === 'week') {
            newDate.setDate(newDate.getDate() + 7);
        } else if (currentView === 'day') {
            newDate.setDate(newDate.getDate() + 1);
        }
        
        setCurrentDate(newDate);
        onDateSelect(newDate);
    };

    const navigateToday = () => {
        const today = new Date();
        setCurrentDate(today);
        onDateSelect(today);
    };

    const formatMonthYear = () => {
        return currentDate.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
        });
    };

    const formatWeekRange = () => {
        const startOfWeek = new Date(currentDate);
        const dayOfWeek = startOfWeek.getDay();
        startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        const options = { month: 'short', day: 'numeric' };
        return `${startOfWeek.toLocaleDateString('en-US', options)} - ${endOfWeek.toLocaleDateString('en-US', options)}, ${endOfWeek.getFullYear()}`;
    };

    const formatDayDate = () => {
        return currentDate.toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'long', 
            day: 'numeric',
            year: 'numeric' 
        });
    };

    const getDisplayTitle = () => {
        if (currentView === 'month') return formatMonthYear();
        if (currentView === 'week') return formatWeekRange();
        if (currentView === 'day') return formatDayDate();
        return '';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'SCHEDULED':
                return 'bg-blue-500';
            case 'IN_PROGRESS':
                return 'bg-yellow-500';
            case 'COMPLETED':
                return 'bg-green-500';
            case 'CANCELLED':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    const isToday = (date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const renderMeetingCard = (meeting, isCompact = false) => {
        // Mobile-optimized compact card
        if (isCompact && isMobile) {
            return (
                <div
                    key={meeting.id}
                    onClick={(e) => {
                        e.stopPropagation();
                        onMeetingSelect(meeting);
                    }}
                    className={`p-2 rounded-lg cursor-pointer active:scale-[0.98] transition-all
                        ${getStatusColor(meeting.status)} text-white`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold truncate">{meeting.title}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <Clock className="h-2.5 w-2.5" />
                                <span className="text-[10px]">
                                    {new Date(meeting.meetingDate).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        </div>
                        {meeting.meetingType === 'RECURRING' && (
                            <RefreshCw className="h-3 w-3 flex-shrink-0 ml-1" />
                        )}
                    </div>
                </div>
            );
        }
        
        // Desktop compact card
        if (isCompact) {
            return (
                <div
                    key={meeting.id}
                    onClick={(e) => {
                        e.stopPropagation();
                        onMeetingSelect(meeting);
                    }}
                    className={`text-xs p-1 mb-1 rounded cursor-pointer hover:opacity-80 transition-opacity
                        ${getStatusColor(meeting.status)} text-white`}
                >
                    <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">
                            {new Date(meeting.meetingDate).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                    </div>
                    <p className="truncate">{meeting.title}</p>
                    {meeting.meetingType === 'RECURRING' && (
                        <RefreshCw className="h-3 w-3 inline-block ml-1" />
                    )}
                </div>
            );
        }

        // Full meeting card (desktop)
        return (
            <div
                key={meeting.id}
                onClick={() => onMeetingSelect(meeting)}
                className={`p-3 mb-2 rounded-lg border cursor-pointer hover:shadow-md transition-shadow
                    ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            >
                <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-sm">{meeting.title}</h4>
                    <span className={`px-2 py-1 rounded text-xs text-white ${getStatusColor(meeting.status)}`}>
                        {meeting.status}
                    </span>
                </div>
                
                <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span>
                            {new Date(meeting.meetingDate).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                            {meeting.duration && ` (${meeting.duration} min)`}
                        </span>
                    </div>
                    
                    {meeting.location && (
                        <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="truncate">{meeting.location}</span>
                        </div>
                    )}
                    
                    {meeting.meetingLink && (
                        <div className="flex items-center gap-2">
                            <Video className="h-3 w-3 text-gray-400" />
                            <span>Online Meeting</span>
                        </div>
                    )}
                    
                    {meeting.participants && (
                        <div className="flex items-center gap-2">
                            <Users className="h-3 w-3 text-gray-400" />
                            <span>{meeting.participants.length} participants</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderMonthView = () => {
        const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const mobileWeekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

        if (isMobile) {
            // Mobile Month View: Compact calendar grid with expandable days
            return (
                <div>
                    {/* Mobile weekday headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {mobileWeekDays.map(day => (
                            <div
                                key={day}
                                className={`text-center text-xs font-semibold py-1
                                    ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Mobile calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, index) => {
                            const dayMeetings = getMeetingsForDate(day.date);
                            const hasMeetings = dayMeetings.length > 0;
                            
                            return (
                                <div
                                    key={index}
                                    onClick={() => {
                                        setCurrentDate(day.date);
                                        onDateSelect(day.date);
                                        setCurrentView('day');
                                    }}
                                    className={`relative aspect-square p-1 border rounded-lg cursor-pointer transition-all
                                        ${day.isCurrentMonth
                                            ? isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                            : isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50/50 border-gray-100'
                                        }
                                        ${isToday(day.date)
                                            ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : ''
                                        }
                                        active:scale-95`}
                                >
                                    {/* Date number */}
                                    <div className={`text-xs font-medium text-center
                                        ${!day.isCurrentMonth
                                            ? 'text-gray-400'
                                            : isToday(day.date)
                                                ? 'text-blue-600 dark:text-blue-400'
                                                : isDark ? 'text-white' : 'text-gray-900'
                                        }`}
                                    >
                                        {day.date.getDate()}
                                    </div>
                                    
                                    {/* Meeting indicators */}
                                    {hasMeetings && (
                                        <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5">
                                            {dayMeetings.slice(0, 3).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="h-1 w-1 rounded-full bg-blue-500"
                                                />
                                            ))}
                                            {dayMeetings.length > 3 && (
                                                <span className="text-[8px] text-gray-500">+{dayMeetings.length - 3}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Today's meetings summary */}
                    {(() => {
                        const todayMeetings = getMeetingsForDate(new Date());
                        if (todayMeetings.length > 0) {
                            return (
                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                                        Today's Meetings ({todayMeetings.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {todayMeetings.slice(0, 2).map(meeting => (
                                            <div
                                                key={meeting.id}
                                                onClick={() => onMeetingSelect(meeting)}
                                                className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded cursor-pointer hover:shadow-sm transition-shadow"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium truncate">{meeting.title}</p>
                                                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                        <Clock className="h-3 w-3" />
                                                        <span>
                                                            {new Date(meeting.meetingDate).toLocaleTimeString('en-US', {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-gray-400" />
                                            </div>
                                        ))}
                                        {todayMeetings.length > 2 && (
                                            <button
                                                onClick={() => {
                                                    setCurrentDate(new Date());
                                                    setCurrentView('day');
                                                }}
                                                className="w-full text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                                View all today's meetings
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })()}
                </div>
            );
        }

        // Desktop Grid Layout: 7 columns
        return (
            <div>
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                    {weekDays.map(day => (
                        <div
                            key={day}
                            className={`text-center text-sm font-semibold py-2
                                ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => {
                        const dayMeetings = getMeetingsForDate(day.date);
                        const hasMoreMeetings = dayMeetings.length > 2;

                        return (
                            <div
                                key={index}
                                onClick={() => {
                                    setCurrentDate(day.date);
                                    onDateSelect(day.date);
                                    setCurrentView('day');
                                }}
                                className={`min-h-[100px] p-2 border rounded-lg cursor-pointer transition-colors
                                    ${day.isCurrentMonth
                                        ? isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                        : isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-100'
                                    }
                                    ${isToday(day.date)
                                        ? 'ring-2 ring-blue-500'
                                        : ''
                                    }
                                    hover:${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-sm font-medium
                                        ${!day.isCurrentMonth
                                            ? 'text-gray-400'
                                            : isDark ? 'text-white' : 'text-gray-900'
                                        }
                                        ${isToday(day.date) ? 'text-blue-500' : ''}`}
                                    >
                                        {day.date.getDate()}
                                    </span>
                                    {dayMeetings.length > 0 && (
                                        <span className="text-xs bg-blue-500 text-white px-1 rounded">
                                            {dayMeetings.length}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    {dayMeetings.slice(0, 2).map(meeting =>
                                        renderMeetingCard(meeting, true)
                                    )}
                                    {hasMoreMeetings && (
                                        <p className="text-xs text-gray-500">
                                            +{dayMeetings.length - 2} more
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderWeekView = () => {
        if (isMobile) {
            // Mobile Week View: Vertical list of days
            return (
                <div className="space-y-3">
                    {calendarDays.map((day, index) => {
                        const dayMeetings = getMeetingsForDate(day.date);
                        const isCurrentDay = isToday(day.date);
                        
                        return (
                            <div
                                key={index}
                                className={`rounded-lg border transition-all
                                    ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
                                    ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}`}
                            >
                                {/* Day header */}
                                <div className={`p-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}
                                    ${isCurrentDay ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className={`text-sm font-semibold ${isCurrentDay ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                                                {day.date.toLocaleDateString('en-US', { weekday: 'long' })}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {dayMeetings.length > 0 && (
                                                <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                                                    {dayMeetings.length}
                                                </span>
                                            )}
                                            {onCreateMeeting && (
                                                <button
                                                    onClick={() => onCreateMeeting(day.date)}
                                                    className="p-1.5 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Day meetings */}
                                <div className="p-3">
                                    {dayMeetings.length > 0 ? (
                                        <div className="space-y-2">
                                            {dayMeetings.map(meeting => (
                                                <div
                                                    key={meeting.id}
                                                    onClick={() => onMeetingSelect(meeting)}
                                                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:shadow-sm transition-shadow"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{meeting.title}</p>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                            <Clock className="h-3 w-3" />
                                                            <span>
                                                                {new Date(meeting.meetingDate).toLocaleTimeString('en-US', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </span>
                                                            {meeting.location && (
                                                                <>
                                                                    <span>•</span>
                                                                    <MapPin className="h-3 w-3" />
                                                                    <span className="truncate">{meeting.location}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="h-4 w-4 text-gray-400 ml-2" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-500 text-center py-2">No meetings</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        }

        // Desktop Week View (unchanged)
        const timeSlots = [];
        for (let hour = 0; hour < 24; hour++) {
            timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
        }
        
        return (
            <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                    {/* Day headers */}
                    <div className="grid grid-cols-8 gap-1 mb-2">
                        <div className="w-16"></div>
                        {calendarDays.map((day, index) => (
                            <div
                                key={index}
                                className={`text-center p-2 border-b
                                    ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                            >
                                <div className="text-sm font-semibold">
                                    {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                                </div>
                                <div className={`text-lg ${isToday(day.date) ? 'text-blue-500 font-bold' : ''}`}>
                                    {day.date.getDate()}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Time grid */}
                    <div className="relative">
                        {timeSlots.map((time, timeIndex) => (
                            <div key={timeIndex} className="grid grid-cols-8 gap-1">
                                <div className={`w-16 text-xs p-2 text-right
                                    ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {time}
                                </div>
                                {calendarDays.map((day, dayIndex) => {
                                    const dayMeetings = getMeetingsForDate(day.date);
                                    const hourMeetings = dayMeetings.filter(m => {
                                        const meetingHour = new Date(m.meetingDate).getHours();
                                        return meetingHour === timeIndex;
                                    });
                                    
                                    return (
                                        <div
                                            key={dayIndex}
                                            className={`min-h-[60px] p-1 border
                                                ${isDark
                                                    ? 'bg-gray-800 border-gray-700'
                                                    : 'bg-white border-gray-200'
                                                }`}
                                        >
                                            {hourMeetings.map(meeting =>
                                                renderMeetingCard(meeting, true)
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderDayView = () => {
        const dayMeetings = getMeetingsForDate(currentDate);
        const timeSlots = [];
        for (let hour = 0; hour < 24; hour++) {
            timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
        }
        
        return (
            <div>
                <div className="mb-4">
                    <h3 className="text-lg font-semibold">
                        {currentDate.toLocaleDateString('en-US', { 
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </h3>
                    <p className="text-sm text-gray-500">
                        {dayMeetings.length} meeting{dayMeetings.length !== 1 ? 's' : ''} scheduled
                    </p>
                </div>
                
                <div className="space-y-2">
                    {timeSlots.map((time, index) => {
                        const hourMeetings = dayMeetings.filter(m => {
                            const meetingHour = new Date(m.meetingDate).getHours();
                            return meetingHour === index;
                        });
                        
                        if (hourMeetings.length === 0) return null;
                        
                        return (
                            <div key={index} className="flex gap-4">
                                <div className={`w-20 text-sm font-medium py-3
                                    ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {time}
                                </div>
                                <div className="flex-1">
                                    {hourMeetings.map(meeting => 
                                        renderMeetingCard(meeting, false)
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    
                    {dayMeetings.length === 0 && (
                        <div className="text-center py-12">
                            <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-500">No meetings scheduled for this day</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className={`rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'} ${isMobile ? 'p-2' : 'p-4'}`}>
            {/* Calendar Header - Mobile Responsive */}
            {isMobile ? (
                <div className="mb-4">
                    {/* Mobile Header - Row 1: Title and Menu */}
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base font-semibold flex-1">
                            {getDisplayTitle()}
                        </h2>
                        <button
                            onClick={() => setShowViewOptions(!showViewOptions)}
                            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            {showViewOptions ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                    
                    {/* Mobile Header - Row 2: Navigation */}
                    <div className="flex items-center justify-between gap-2">
                        <button
                            onClick={navigatePrevious}
                            className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow hover:shadow-md transition-all"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        
                        <button
                            onClick={navigateToday}
                            className="flex-1 px-4 py-2 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors font-medium"
                        >
                            Today
                        </button>
                        
                        <button
                            onClick={navigateNext}
                            className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow hover:shadow-md transition-all"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                    
                    {/* Mobile View Options - Collapsible */}
                    {showViewOptions && (
                        <div className="mt-3 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => {
                                        setCurrentView('day');
                                        setShowViewOptions(false);
                                    }}
                                    className={`px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-1
                                        ${currentView === 'day'
                                            ? 'bg-blue-500 text-white'
                                            : 'border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <CalendarDays className="h-4 w-4" />
                                    Day
                                </button>
                                
                                <button
                                    onClick={() => {
                                        setCurrentView('week');
                                        setShowViewOptions(false);
                                    }}
                                    className={`px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-1
                                        ${currentView === 'week'
                                            ? 'bg-blue-500 text-white'
                                            : 'border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <List className="h-4 w-4" />
                                    Week
                                </button>
                                
                                <button
                                    onClick={() => {
                                        setCurrentView('month');
                                        setShowViewOptions(false);
                                    }}
                                    className={`px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-1
                                        ${currentView === 'month'
                                            ? 'bg-blue-500 text-white'
                                            : 'border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <Grid3x3 className="h-4 w-4" />
                                    Month
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                // Desktop Header (unchanged)
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={navigatePrevious}
                            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        
                        <button
                            onClick={navigateNext}
                            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                        
                        <button
                            onClick={navigateToday}
                            className="px-3 py-1 text-sm rounded border hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors
                                dark:border-gray-700 border-gray-300"
                        >
                            Today
                        </button>
                        
                        <h2 className="text-lg font-semibold ml-4">
                            {getDisplayTitle()}
                        </h2>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentView('day')}
                            className={`px-3 py-1 text-sm rounded transition-colors
                                ${currentView === 'day'
                                    ? 'bg-blue-500 text-white'
                                    : 'border hover:bg-gray-200 dark:hover:bg-gray-700 dark:border-gray-700 border-gray-300'
                                }`}
                        >
                            Day
                        </button>
                        
                        <button
                            onClick={() => setCurrentView('week')}
                            className={`px-3 py-1 text-sm rounded transition-colors
                                ${currentView === 'week'
                                    ? 'bg-blue-500 text-white'
                                    : 'border hover:bg-gray-200 dark:hover:bg-gray-700 dark:border-gray-700 border-gray-300'
                                }`}
                        >
                            Week
                        </button>
                        
                        <button
                            onClick={() => setCurrentView('month')}
                            className={`px-3 py-1 text-sm rounded transition-colors
                                ${currentView === 'month'
                                    ? 'bg-blue-500 text-white'
                                    : 'border hover:bg-gray-200 dark:hover:bg-gray-700 dark:border-gray-700 border-gray-300'
                                }`}
                        >
                            Month
                        </button>
                    </div>
                </div>
            )}
            
            {/* Calendar Content with Touch Support */}
            <div
                ref={swipeAreaRef}
                onTouchStart={isMobile ? onTouchStart : undefined}
                onTouchMove={isMobile ? onTouchMove : undefined}
                onTouchEnd={isMobile ? onTouchEnd : undefined}
            >
                {currentView === 'month' && renderMonthView()}
                {currentView === 'week' && renderWeekView()}
                {currentView === 'day' && renderDayView()}
            </div>

            {/* Mobile Swipe Indicator */}
            {isMobile && (
                <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                        <ChevronLeft className="h-3 w-3" />
                        Swipe to navigate
                        <ChevronRight className="h-3 w-3" />
                    </p>
                </div>
            )}
        </div>
    );
};

export default MeetingCalendarView;