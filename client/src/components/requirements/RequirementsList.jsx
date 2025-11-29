import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Badge,
    Button,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    Card,
    CardContent,
    Skeleton,
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '@/components/ui';
import {
    ChevronRight,
    ChevronDown,
    MoreHorizontal,
    Edit,
    Trash,
    GitBranch,
    Link,
    TestTube,
    MessageSquare,
    Archive,
    CheckCircle,
    Clock,
    AlertCircle,
    FileText,
    Target,
    Eye,
    Maximize2
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const RequirementsList = ({
    requirements,
    viewMode = 'list',
    onSelect,
    onUpdate,
    onDelete,
    onBaseline,
    isDark,
    loading
}) => {
    const { t } = useTranslation();
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [draggedRequirement, setDraggedRequirement] = useState(null);

    const toggleExpand = (requirementId) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(requirementId)) {
            newExpanded.delete(requirementId);
        } else {
            newExpanded.add(requirementId);
        }
        setExpandedRows(newExpanded);
    };

    const getStatusIcon = (status) => {
        const icons = {
            DRAFT: <FileText className="h-4 w-4" />,
            REVIEW: <Clock className="h-4 w-4" />,
            APPROVED: <CheckCircle className="h-4 w-4" />,
            IMPLEMENTED: <Target className="h-4 w-4" />,
            VERIFIED: <CheckCircle className="h-4 w-4" />,
            CLOSED: <Archive className="h-4 w-4" />
        };
        return icons[status] || <AlertCircle className="h-4 w-4" />;
    };

    const getStatusColor = (status) => {
        const colors = {
            DRAFT: 'bg-gray-500',
            REVIEW: 'bg-blue-500',
            APPROVED: 'bg-green-500',
            IMPLEMENTED: 'bg-purple-500',
            VERIFIED: 'bg-teal-500',
            CLOSED: 'bg-gray-700'
        };
        return colors[status] || 'bg-gray-500';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            LOW: 'bg-gray-500',
            MEDIUM: 'bg-yellow-500',
            HIGH: 'bg-orange-500',
            CRITICAL: 'bg-red-500'
        };
        return colors[priority] || 'bg-gray-500';
    };

    const getTypeColor = (type) => {
        const colors = {
            FUNCTIONAL: 'bg-blue-500',
            NON_FUNCTIONAL: 'bg-purple-500',
            BUSINESS: 'bg-green-500',
            TECHNICAL: 'bg-orange-500'
        };
        return colors[type] || 'bg-gray-500';
    };

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const sourceStatus = result.source.droppableId;
        const destStatus = result.destination.droppableId;
        const requirementId = result.draggableId;

        if (sourceStatus !== destStatus) {
            onUpdate(requirementId, { status: destStatus });
        }
    };

    // Mobile Card View for requirements
    const MobileRequirementCard = ({ requirement }) => {
        return (
            <Card
                className={`mb-2  cursor-pointer`}
                onClick={() => onSelect(requirement)}
            >
                <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2 gap-2">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`font-mono text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {requirement.requirementId}
                                </span>
                                {requirement.isBaseline && (
                                    <Badge className="bg-purple-500 text-white text-xs">
                                        {t('requirements.baseline')}
                                    </Badge>
                                )}
                            </div>
                            <h4 className="font-medium text-sm mb-1">{requirement.title}</h4>
                            {requirement.description && (
                                <p className={`text-xs line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {requirement.description}
                                </p>
                            )}
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onSelect(requirement)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    {t('requirements.view')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onUpdate(requirement.id, requirement)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    {t('requirements.edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onBaseline(requirement.id)}>
                                    <Archive className="mr-2 h-4 w-4" />
                                    {t('requirements.baseline')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => onDelete(requirement.id)}
                                    className="text-red-600"
                                >
                                    <Trash className="mr-2 h-4 w-4" />
                                    {t('requirements.delete')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                        <Badge className={getTypeColor(requirement.type) + ' text-white text-xs'}>
                            {t(`requirements.type.${requirement.type.toLowerCase()}`)}
                        </Badge>
                        <div className="flex items-center gap-1">
                            {getStatusIcon(requirement.status)}
                            <Badge className={getStatusColor(requirement.status) + ' text-white text-xs'}>
                                {t(`requirements.status.${requirement.status.toLowerCase()}`)}
                            </Badge>
                        </div>
                        <Badge className={getPriorityColor(requirement.priority) + ' text-white text-xs'}>
                            {t(`requirements.priority.${requirement.priority.toLowerCase()}`)}
                        </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                                <img
                                    src={requirement.owner?.image || '/default-avatar.png'}
                                    alt={requirement.owner?.name}
                                    className="h-4 w-4 rounded-full"
                                />
                                <span className="truncate max-w-[100px]">{requirement.owner?.name}</span>
                            </div>
                            <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {new Date(requirement.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <div className={`flex items-center gap-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            <span className="flex items-center gap-1">
                                <Link className="h-3 w-3" />
                                {requirement.taskLinks?.length || 0}
                            </span>
                            <span className="flex items-center gap-1">
                                <TestTube className="h-3 w-3" />
                                {requirement.testCases?.length || 0}
                            </span>
                            <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {requirement.comments?.length || 0}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    // Tree View Component
    const TreeNode = ({ requirement, level = 0 }) => {
        const isExpanded = expandedRows.has(requirement.id);
        const hasChildren = requirement.children && requirement.children.length > 0;

        return (
            <>
                <TableRow
                    className={`cursor-pointer transition-colors bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 ${
  level > 0 ? 'bg-gray-50/50 dark:bg-gray-800/70' : ''
}`}
                    onClick={() => onSelect(requirement)}
                >
                    <TableCell className="w-12">
                        {hasChildren && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="p-0 h-6 w-6"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpand(requirement.id);
                                }}
                            >
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </Button>
                        )}
                    </TableCell>
                    <TableCell>
                        <div style={{ paddingLeft: `${level * 24}px` }}>
                            <div className="flex items-center gap-2">
                                <span className={`font-mono text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {requirement.requirementId}
                                </span>
                                {requirement.isBaseline && (
                                    <Badge className="bg-purple-500 text-white">
                                        {t('requirements.baseline')}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </TableCell>
                    <TableCell className="min-w-[200px]">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{requirement.title}</span>
                        </div>
                        {requirement.description && (
                            <p className={`text-sm mt-1 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {requirement.description}
                            </p>
                        )}
                    </TableCell>
                    <TableCell>
                        <Badge className={getTypeColor(requirement.type) + ' text-white'}>
                            {t(`requirements.type.${requirement.type.toLowerCase()}`)}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-1">
                            {getStatusIcon(requirement.status)}
                            <Badge className={getStatusColor(requirement.status) + ' text-white'}>
                                {t(`requirements.status.${requirement.status.toLowerCase()}`)}
                            </Badge>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge className={getPriorityColor(requirement.priority) + ' text-white'}>
                            {t(`requirements.priority.${requirement.priority.toLowerCase()}`)}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-1">
                            <img 
                                src={requirement.owner?.image || '/default-avatar.png'}
                                alt={requirement.owner?.name}
                                className="h-6 w-6 rounded-full"
                            />
                            <span className="text-sm">{requirement.owner?.name}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className={`flex items-center gap-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            <div
                                className="group relative flex items-center gap-1 border rounded px-2 py-1 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all"
                                title={t('requirements.linkedTasks')}
                            >
                                <Link className="h-4 w-4" />
                                <span className="text-xs font-medium">
                                    {requirement.taskLinks?.length || 0}
                                </span>
                                <span className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[100] shadow-lg">
                                    {t('requirements.linkedTasks')}
                                </span>
                            </div>

                            <div
                                className="group relative flex items-center gap-1 border rounded px-2 py-1 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all"
                                title={t('requirements.testCases')}
                            >
                                <TestTube className="h-4 w-4" />
                                <span className="text-xs font-medium">
                                    {requirement.testCases?.length || 0}
                                </span>
                                <span className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[100] shadow-lg">
                                    {t('requirements.testCases')}
                                </span>
                            </div>

                            <div
                                className="group relative flex items-center gap-1 border rounded px-2 py-1 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all"
                                title={t('requirements.comments')}
                            >
                                <MessageSquare className="h-4 w-4" />
                                <span className="text-xs font-medium">
                                    {requirement.comments?.length || 0}
                                </span>
                                <span className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[100] shadow-lg">
                                    {t('requirements.comments')}
                                </span>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onSelect(requirement)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    {t('requirements.view')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onUpdate(requirement.id, requirement)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    {t('requirements.edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onBaseline(requirement.id)}>
                                    <Archive className="mr-2 h-4 w-4" />
                                    {t('requirements.baseline')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => onDelete(requirement.id)}
                                    className="text-red-600"
                                >
                                    <Trash className="mr-2 h-4 w-4" />
                                    {t('requirements.delete')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
                {isExpanded && hasChildren && requirement.children.map(child => (
                    <TreeNode 
                        key={child.id} 
                        requirement={child} 
                        level={level + 1}
                    />
                ))}
            </>
        );
    };

    // Board View Component
    const BoardView = () => {
        const statuses = ['DRAFT', 'REVIEW', 'APPROVED', 'IMPLEMENTED', 'VERIFIED', 'CLOSED'];
        const requirementsByStatus = useMemo(() => {
            const grouped = {};
            statuses.forEach(status => {
                grouped[status] = requirements.filter(req => req.status === status);
            });
            return grouped;
        }, [requirements]);

        return (
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
                    {statuses.map(status => (
                        <Droppable key={status} droppableId={status}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`min-w-[280px] flex-shrink-0 snap-center min-h-[500px] ${
                                        snapshot.isDraggingOver
                                            ? isDark ? 'bg-blue-900/20' : 'bg-blue-50'
                                            : ''
                                    }`}
                                >
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-semibold text-xs sm:text-sm">
                                                {t(`requirements.status.${status.toLowerCase()}`)}
                                            </h3>
                                            <Badge className={getStatusColor(status) + ' text-white'}>
                                                {requirementsByStatus[status].length}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {requirementsByStatus[status].map((requirement, index) => (
                                            <Draggable
                                                key={requirement.id}
                                                draggableId={requirement.id}
                                                index={index}
                                            >
                                                {(provided, snapshot) => (
                                                    <Card
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`cursor-pointer ${
                                                            snapshot.isDragging
                                                                ? 'shadow-lg opacity-90'
                                                                : ''
                                                        } ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}
                                                        onClick={() => onSelect(requirement)}
                                                    >
                                                        <CardContent className="p-3">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <span className={`font-mono text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                    {requirement.requirementId}
                                                                </span>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-6 w-6 p-0"
                                                                        >
                                                                            <MoreHorizontal className="h-3 w-3" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem onClick={() => onSelect(requirement)}>
                                                                            <Eye className="mr-2 h-3 w-3" />
                                                                            {t('requirements.view')}
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => onDelete(requirement.id)}>
                                                                            <Trash className="mr-2 h-3 w-3" />
                                                                            {t('requirements.delete')}
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                            
                                                            <h4 className="font-medium text-sm mb-2 line-clamp-2">
                                                                {requirement.title}
                                                            </h4>
                                                            
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Badge 
                                                                    className={getTypeColor(requirement.type) + ' text-white text-xs'}
                                                                >
                                                                    {requirement.type}
                                                                </Badge>
                                                                <Badge 
                                                                    className={getPriorityColor(requirement.priority) + ' text-white text-xs'}
                                                                >
                                                                    {requirement.priority}
                                                                </Badge>
                                                            </div>

                                                            <div className={`flex items-center justify-between text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                <div className="flex items-center gap-1">
                                                                    <img 
                                                                        src={requirement.owner?.image || '/default-avatar.png'}
                                                                        alt={requirement.owner?.name}
                                                                        className="h-5 w-5 rounded-full"
                                                                    />
                                                                    <span>{requirement.owner?.name}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="flex items-center gap-1">
                                                                        <Link className="h-3 w-3" />
                                                                        {requirement.taskLinks?.length || 0}
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <MessageSquare className="h-3 w-3" />
                                                                        {requirement.comments?.length || 0}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                </div>
                            )}
                        </Droppable>
                    ))}
                </div>
            </DragDropContext>
        );
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        );
    }

    if (requirements.length === 0) {
        return (
            <Card className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className={`h-12 w-12 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t('requirements.noRequirements')}
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Check if we're on mobile
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    if (viewMode === 'board') {
        return <BoardView />;
    }

    // Show mobile cards on small screens for list/tree views
    if (isMobile && viewMode !== 'board') {
        return (
            <div className="space-y-2">
                {requirements.map(requirement => (
                    <MobileRequirementCard key={requirement.id} requirement={requirement} />
                ))}
            </div>
        );
    }

    // Desktop - List and Tree View
    return (
        <div className="overflow-x-auto">
            <Table className={`${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} min-w-full`}>
                <TableHeader className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} sticky top-0 z-10`}>
                    <TableRow className={`${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-100'}`}>
                        <TableHead className={`w-12 ${isDark ? 'text-gray-400' : ''}`}></TableHead>
                        <TableHead className={`${isDark ? 'text-gray-400' : ''}`}>{t('requirements.id')}</TableHead>
                        <TableHead className={`min-w-[200px] ${isDark ? 'text-gray-400' : ''}`}>{t('requirements.title')}</TableHead>
                        <TableHead className={`${isDark ? 'text-gray-400' : ''}`}>{t('requirements.typeLabel')}</TableHead>
                        <TableHead className={`${isDark ? 'text-gray-400' : ''}`}>{t('requirements.statusLabel')}</TableHead>
                        <TableHead className={`${isDark ? 'text-gray-400' : ''}`}>{t('requirements.priorityLabel')}</TableHead>
                        <TableHead className={`${isDark ? 'text-gray-400' : ''}`}>{t('requirements.owner')}</TableHead>
                        <TableHead className={`${isDark ? 'text-gray-400' : ''}`}>{t('requirements.links')}</TableHead>
                        <TableHead className={`w-20 ${isDark ? 'text-gray-400' : ''}`}>{t('requirements.actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {viewMode === 'tree' ? (
                        requirements.map(requirement => (
                            <TreeNode key={requirement.id} requirement={requirement} />
                        ))
                    ) : (
                        requirements.map(requirement => (
                            <TreeNode key={requirement.id} requirement={requirement} />
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default RequirementsList;
