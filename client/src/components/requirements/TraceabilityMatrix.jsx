import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@clerk/clerk-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Badge,
    Button,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Checkbox,
} from '@/components/ui';
import {
    Download,
    FileText,
    Link,
    Users,
    Calendar,
    TestTube,
    GitBranch
} from 'lucide-react';
import { requirementService } from '../../services/requirementService';
import toast from 'react-hot-toast';

const TraceabilityMatrix = ({ projectId, requirements, isDark }) => {
    const { t } = useTranslation();
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [matrixData, setMatrixData] = useState(null);
    const [filters, setFilters] = useState({
        type: 'all',
        status: 'all',
        showStakeholders: true,
        showTasks: true,
        showMeetings: false,
        showTestCases: true
    });

    useEffect(() => {
        if (projectId) {
            fetchMatrixData();
        }
    }, [projectId]);

    const fetchMatrixData = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            if (!token) {
                console.error('No authentication token available');
                toast.error('Authentication required');
                return;
            }
            const response = await requirementService.getTraceabilityMatrix(projectId, token);
            setMatrixData(response);
        } catch (error) {
            console.error('Error fetching matrix data:', error);
            toast.error(t('requirements.matrix.fetchError'));
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        if (!matrixData?.matrix) return;

        const headers = [
            'Requirement ID',
            'Title',
            'Type',
            'Status',
            'Priority',
            'Owner',
            filters.showStakeholders && 'Stakeholders',
            filters.showTasks && 'Linked Tasks',
            filters.showTestCases && 'Test Cases',
            filters.showMeetings && 'Meetings'
        ].filter(Boolean);

        const rows = matrixData.matrix.map(req => [
            req.id,
            req.title,
            req.type,
            req.status,
            req.priority,
            req.owner,
            filters.showStakeholders && req.stakeholders.map(s => s.name).join('; '),
            filters.showTasks && req.tasks.map(t => `${t.title} (${t.status})`).join('; '),
            filters.showTestCases && req.testCases?.map(tc => tc.name).join('; '),
            filters.showMeetings && req.meetings?.map(m => m.title).join('; ')
        ].filter(Boolean));

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `traceability-matrix-${projectId}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
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

    if (loading) {
        return (
            <Card className={isDark ? 'bg-gray-800' : ''}>
                <CardContent className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="ml-4">{t('requirements.matrix.loading')}</p>
                </CardContent>
            </Card>
        );
    }

    const filteredRequirements = requirements.filter(req => {
        if (filters.type !== 'all' && req.type !== filters.type) return false;
        if (filters.status !== 'all' && req.status !== filters.status) return false;
        return true;
    });

    return (
        <div>
            <Card className={`mb-6  border dark:bg-gray-950 dark:border-gray-700 border-gray-200 bg-white`}>
                <CardHeader>
                    <CardTitle className="grid grid-cols-1 gap-2 md:flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <GitBranch className="h-5 w-5" />
<span className='text-sm md:text-2xl'>                            {t('requirements.matrix.title')}
</span>                        </div>
                        <Button onClick={exportToCSV} size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            {t('requirements.matrix.exportCSV')}
                        </Button>
                    </CardTitle>
                    <CardDescription>
                        {t('requirements.matrix.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4 mb-4">
                        <Select
                            value={filters.type}
                            onValueChange={(value) => setFilters({ ...filters, type: value })}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue>
                                    {filters.type === 'all'
                                        ? t('requirements.matrix.filters.allTypes')
                                        : t(`requirements.type.${filters.type.toLowerCase()}`)}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('requirements.matrix.filters.allTypes')}</SelectItem>
                                <SelectItem value="FUNCTIONAL">{t('requirements.type.functional')}</SelectItem>
                                <SelectItem value="NON_FUNCTIONAL">{t('requirements.type.nonFunctional')}</SelectItem>
                                <SelectItem value="BUSINESS">{t('requirements.type.business')}</SelectItem>
                                <SelectItem value="TECHNICAL">{t('requirements.type.technical')}</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.status}
                            onValueChange={(value) => setFilters({ ...filters, status: value })}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue>
                                    {filters.status === 'all'
                                        ? t('requirements.matrix.filters.allStatus')
                                        : t(`requirements.status.${filters.status.toLowerCase()}`)}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('requirements.matrix.filters.allStatus')}</SelectItem>
                                <SelectItem value="DRAFT">{t('requirements.status.draft')}</SelectItem>
                                <SelectItem value="REVIEW">{t('requirements.status.review')}</SelectItem>
                                <SelectItem value="APPROVED">{t('requirements.status.approved')}</SelectItem>
                                <SelectItem value="IMPLEMENTED">{t('requirements.status.implemented')}</SelectItem>
                                <SelectItem value="VERIFIED">{t('requirements.status.verified')}</SelectItem>
                                <SelectItem value="CLOSED">{t('requirements.status.closed')}</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className=" gap-4">
                            <span className="text-sm font-medium">{t('requirements.matrix.filters.show')}:</span>
                            <label className="flex items-center gap-2">
                                <Checkbox
                                    checked={filters.showStakeholders}
                                    onCheckedChange={(checked) => setFilters({ ...filters, showStakeholders: checked })}
                                />
                                <span className="text-sm">{t('requirements.matrix.filters.stakeholders')}</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <Checkbox
                                    checked={filters.showTasks}
                                    onCheckedChange={(checked) => setFilters({ ...filters, showTasks: checked })}
                                />
                                <span className="text-sm">{t('requirements.matrix.filters.tasks')}</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <Checkbox
                                    checked={filters.showTestCases}
                                    onCheckedChange={(checked) => setFilters({ ...filters, showTestCases: checked })}
                                />
                                <span className="text-sm">{t('requirements.testCases')}</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <Checkbox
                                    checked={filters.showMeetings}
                                    onCheckedChange={(checked) => setFilters({ ...filters, showMeetings: checked })}
                                />
                                <span className="text-sm">{t('requirements.matrix.filters.meetings')}</span>
                            </label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className={isDark ? 'bg-gray-800' : ''}>
                <CardContent className="p-0">
                    {filteredRequirements.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">{t('requirements.matrix.noData')}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-32">{t('requirements.id')}</TableHead>
                                        <TableHead>{t('requirements.title')}</TableHead>
                                        <TableHead>{t('requirements.typeLabel')}</TableHead>
                                        <TableHead>{t('requirements.statusLabel')}</TableHead>
                                        <TableHead>{t('requirements.priorityLabel')}</TableHead>
                                        {filters.showStakeholders && (
                                            <TableHead>{t('requirements.matrix.filters.stakeholders')}</TableHead>
                                        )}
                                        {filters.showTasks && (
                                            <TableHead>{t('requirements.matrix.filters.tasks')}</TableHead>
                                        )}
                                        {filters.showTestCases && (
                                            <TableHead>{t('requirements.testCases')}</TableHead>
                                        )}
                                        {filters.showMeetings && (
                                            <TableHead>{t('requirements.matrix.filters.meetings')}</TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRequirements.map((req) => (
                                        <TableRow key={req.id}>
                                            <TableCell className="font-mono text-sm">
                                                {req.requirementId}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{req.title}</p>
                                                    {req.parent && (
                                                        <p className="text-xs text-gray-500">
                                                            ↳ {req.parent.requirementId}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getTypeColor(req.type) + ' text-white'}>
                                                    {t(`requirements.type.${req.type.toLowerCase()}`)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getStatusColor(req.status) + ' text-white'}>
                                                    {t(`requirements.status.${req.status.toLowerCase()}`)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getPriorityColor(req.priority) + ' text-white'}>
                                                    {t(`requirements.priority.${req.priority.toLowerCase()}`)}
                                                </Badge>
                                            </TableCell>
                                            {filters.showStakeholders && (
                                                <TableCell>
                                                    {req.stakeholders && req.stakeholders.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {req.stakeholders.slice(0, 3).map((s, idx) => (
                                                                <Badge key={idx} variant="outline" className="text-xs">
                                                                    <Users className="h-3 w-3 mr-1" />
                                                                    {s.stakeholder?.name}
                                                                </Badge>
                                                            ))}
                                                            {req.stakeholders.length > 3 && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    +{req.stakeholders.length - 3}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500">-</span>
                                                    )}
                                                </TableCell>
                                            )}
                                            {filters.showTasks && (
                                                <TableCell>
                                                    {req.taskLinks && req.taskLinks.length > 0 ? (
                                                        <div className="flex items-center gap-1">
                                                            <Link className="h-4 w-4 text-blue-500" />
                                                            <span className="text-sm">{req.taskLinks.length}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500">-</span>
                                                    )}
                                                </TableCell>
                                            )}
                                            {filters.showTestCases && (
                                                <TableCell>
                                                    {req.testCases && req.testCases.length > 0 ? (
                                                        <div className="flex items-center gap-1">
                                                            <TestTube className="h-4 w-4 text-green-500" />
                                                            <span className="text-sm">{req.testCases.length}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500">-</span>
                                                    )}
                                                </TableCell>
                                            )}
                                            {filters.showMeetings && (
                                                <TableCell>
                                                    {req.meetingLinks && req.meetingLinks.length > 0 ? (
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="h-4 w-4 text-purple-500" />
                                                            <span className="text-sm">{req.meetingLinks.length}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500">-</span>
                                                    )}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default TraceabilityMatrix;