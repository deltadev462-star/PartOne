import React, { useState } from 'react';
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
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui';
import {
    Plus,
    MoreHorizontal,
    Eye,
    Edit,
    Trash,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    FileText,
    TrendingUp
} from 'lucide-react';
import { rfcService } from '../../services/requirementService';
import toast from 'react-hot-toast';

const RFCList = ({ rfcs, onSelect, onCreateNew, isDark }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);

    // Mobile Card View for RFCs
    const MobileRFCCard = ({ rfc }) => {
        return (
            <Card
                className={`mb-2  dark:bg-gray-950 dark:border-gray-700 border-gray-200 bg-white cursor-pointer`}
                onClick={() => onSelect(rfc)}
            >
                <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2 gap-2">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-1">
                                <span className={`font-mono text-xs ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                                    {rfc.rfcId}
                                </span>
                                <div className="flex items-center gap-1">
                                    {getStatusIcon(rfc.status)}
                                    <Badge className={getStatusColor(rfc.status) + ' text-white text-xs'}>
                                        {t(`requirements.rfc.${rfc.status.toLowerCase()}`)}
                                    </Badge>
                                </div>
                            </div>
                            <h4 className="font-medium text-sm mb-1 line-clamp-2">{rfc.title}</h4>
                            {rfc.requirement && (
                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {t('requirements.for')}: {rfc.requirement.requirementId}
                                </p>
                            )}
                            <p className={`text-xs mt-1 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {rfc.reason}
                            </p>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onSelect(rfc)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    {t('requirements.view')}
                                </DropdownMenuItem>
                                {rfc.status === 'PROPOSED' && (
                                    <DropdownMenuItem
                                        onClick={() => handleStatusChange(rfc.id, 'UNDER_REVIEW')}
                                    >
                                        <Clock className="mr-2 h-4 w-4" />
                                        {t('requirements.rfc.startReview')}
                                    </DropdownMenuItem>
                                )}
                                {rfc.status === 'UNDER_REVIEW' && (
                                    <>
                                        <DropdownMenuItem
                                            onClick={() => handleStatusChange(rfc.id, 'APPROVED')}
                                        >
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            {t('requirements.rfc.approve')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => handleStatusChange(rfc.id, 'REJECTED')}
                                        >
                                            <XCircle className="mr-2 h-4 w-4" />
                                            {t('requirements.rfc.reject')}
                                        </DropdownMenuItem>
                                    </>
                                )}
                                {rfc.status === 'APPROVED' && (
                                    <DropdownMenuItem
                                        onClick={() => handleStatusChange(rfc.id, 'IMPLEMENTED')}
                                    >
                                        <TrendingUp className="mr-2 h-4 w-4" />
                                        {t('requirements.rfc.markImplemented')}
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                    onClick={() => handleDelete(rfc.id)}
                                    className="text-red-600"
                                >
                                    <Trash className="mr-2 h-4 w-4" />
                                    {t('requirements.delete')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-2">
                        <Badge className={getImpactLevelColor(rfc.impactLevel) + ' text-white text-xs'}>
                            {rfc.impactLevel}
                        </Badge>
                        {rfc.timeEstimate && (
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {rfc.timeEstimate} {t('requirements.hours')}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs mt-2">
                        <div className="flex items-center gap-1">
                            <img
                                src={rfc.requester?.image || '/default-avatar.png'}
                                alt={rfc.requester?.name}
                                className="h-4 w-4 rounded-full"
                            />
                            <span className="truncate max-w-[100px]">{rfc.requester?.name}</span>
                        </div>
                        <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {new Date(rfc.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                    </div>
                </CardContent>
            </Card>
        );
    };

    const getStatusColor = (status) => {
        const colors = {
            PROPOSED: 'bg-blue-500',
            UNDER_REVIEW: 'bg-yellow-500',
            APPROVED: 'bg-green-500',
            REJECTED: 'bg-red-500',
            IMPLEMENTED: 'bg-purple-500',
            CANCELLED: 'bg-gray-500'
        };
        return colors[status] || 'bg-gray-500';
    };

    const getStatusIcon = (status) => {
        const icons = {
            PROPOSED: <FileText className="h-4 w-4" />,
            UNDER_REVIEW: <Clock className="h-4 w-4" />,
            APPROVED: <CheckCircle className="h-4 w-4" />,
            REJECTED: <XCircle className="h-4 w-4" />,
            IMPLEMENTED: <TrendingUp className="h-4 w-4" />,
            CANCELLED: <XCircle className="h-4 w-4" />
        };
        return icons[status] || <AlertTriangle className="h-4 w-4" />;
    };

    const getImpactLevelColor = (level) => {
        const colors = {
            LOW: 'bg-gray-500',
            MEDIUM: 'bg-yellow-500',
            HIGH: 'bg-orange-500',
            CRITICAL: 'bg-red-500'
        };
        return colors[level] || 'bg-gray-500';
    };

    const handleDelete = async (rfcId) => {
        if (!window.confirm(t('requirements.rfc.deleteConfirm'))) return;
        
        setLoading(true);
        try {
            await rfcService.deleteRFC(rfcId);
            toast.success(t('requirements.rfc.deleteSuccess'));
            // Trigger refresh
            window.location.reload();
        } catch (error) {
            toast.error(t('requirements.rfc.deleteError'));
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (rfcId, newStatus) => {
        setLoading(true);
        try {
            await rfcService.updateRFCStatus(rfcId, newStatus);
            toast.success(t('requirements.rfc.statusChangeSuccess'));
            // Trigger refresh
            window.location.reload();
        } catch (error) {
            toast.error(t('requirements.rfc.statusChangeError'));
        } finally {
            setLoading(false);
        }
    };

    if (rfcs.length === 0) {
        return (
            <Card className="dark:bg-gray-900 dark:border-gray-700 border-gray-200 bg-white">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>{t('requirements.rfcs')}</span>
                        <Button onClick={onCreateNew} size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            {t('requirements.rfc.createNew')}
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className={`h-12 w-12 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t('requirements.noRFCs')}
                    </p>
                    <Button onClick={onCreateNew} className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        {t('requirements.rfc.createNew')}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Check if we're on mobile
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // Show mobile cards on small screens
    if (isMobile) {
        return (
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base sm:text-lg font-semibold">{t('requirements.rfcs')}</h3>
                    <Button onClick={onCreateNew} size="sm" className="text-xs sm:text-sm">
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        {t('requirements.rfc.createNew')}
                    </Button>
                </div>
                
                <div className="space-y-2">
                    {rfcs.map(rfc => (
                        <MobileRFCCard key={rfc.id} rfc={rfc} />
                    ))}
                </div>
            </div>
        );
    }

    // Desktop view
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-base sm:text-lg font-semibold">{t('requirements.rfcs')}</h3>
                <Button onClick={onCreateNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('requirements.rfc.createNew')}
                </Button>
            </div>

            <div className="overflow-x-auto">
                <Table className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} min-w-full`}>
                    <TableHeader className={`${isDark ? 'border-gray-700' : ''} sticky top-0 bg-white dark:bg-gray-800 z-10`}>
                        <TableRow className={isDark ? 'border-gray-700' : ''}>
                            <TableHead className={`${isDark ? 'text-gray-400' : ''}`}>{t('requirements.rfc.id')}</TableHead>
                            <TableHead className={`min-w-[200px] ${isDark ? 'text-gray-400' : ''}`}>{t('requirements.title')}</TableHead>
                            <TableHead className={`${isDark ? 'text-gray-400' : ''}`}>{t('requirements.rfc.reason')}</TableHead>
                            <TableHead className={`${isDark ? 'text-gray-400' : ''}`}>{t('requirements.rfc.impactLevel')}</TableHead>
                            <TableHead className={`${isDark ? 'text-gray-400' : ''}`}>{t('requirements.rfc.status')}</TableHead>
                            <TableHead className={`${isDark ? 'text-gray-400' : ''}`}>{t('requirements.rfc.requester')}</TableHead>
                            <TableHead className={`${isDark ? 'text-gray-400' : ''}`}>{t('requirements.rfc.timeEstimate')}</TableHead>
                            <TableHead className={`w-20 ${isDark ? 'text-gray-400' : ''}`}>{t('requirements.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rfcs.map((rfc) => (
                            <TableRow
                                key={rfc.id}
                                className={`cursor-pointer ${isDark ? 'hover:bg-gray-700 border-gray-700' : 'hover:bg-gray-50'}`}
                                onClick={() => onSelect(rfc)}
                            >
                                <TableCell>
                                    <span className={`font-mono text-xs sm:text-sm ${isDark ? 'text-gray-300' : ''}`}>{rfc.rfcId}</span>
                                </TableCell>
                                <TableCell>
                                    <div>
                                        <p className="font-medium">{rfc.title}</p>
                                        {rfc.requirement && (
                                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {t('requirements.for')}: {rfc.requirement.requirementId}
                                            </p>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm line-clamp-2">{rfc.reason}</p>
                                </TableCell>
                                <TableCell>
                                    <Badge className={getImpactLevelColor(rfc.impactLevel) + ' text-white'}>
                                        {rfc.impactLevel}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        {getStatusIcon(rfc.status)}
                                        <Badge className={getStatusColor(rfc.status) + ' text-white'}>
                                            {t(`requirements.rfc.${rfc.status.toLowerCase()}`)}
                                        </Badge>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <img
                                            src={rfc.requester?.image || '/default-avatar.png'}
                                            alt={rfc.requester?.name}
                                            className="h-6 w-6 rounded-full"
                                        />
                                        <span className="text-sm">{rfc.requester?.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {rfc.timeEstimate ? (
                                        <span className="text-sm">
                                            {rfc.timeEstimate} {t('requirements.hours')}
                                        </span>
                                    ) : (
                                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="sm">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onSelect(rfc)}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                {t('requirements.view')}
                                            </DropdownMenuItem>
                                            {rfc.status === 'PROPOSED' && (
                                                <DropdownMenuItem 
                                                    onClick={() => handleStatusChange(rfc.id, 'UNDER_REVIEW')}
                                                >
                                                    <Clock className="mr-2 h-4 w-4" />
                                                    {t('requirements.rfc.startReview')}
                                                </DropdownMenuItem>
                                            )}
                                            {rfc.status === 'UNDER_REVIEW' && (
                                                <>
                                                    <DropdownMenuItem 
                                                        onClick={() => handleStatusChange(rfc.id, 'APPROVED')}
                                                    >
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        {t('requirements.rfc.approve')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => handleStatusChange(rfc.id, 'REJECTED')}
                                                    >
                                                        <XCircle className="mr-2 h-4 w-4" />
                                                        {t('requirements.rfc.reject')}
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                            {rfc.status === 'APPROVED' && (
                                                <DropdownMenuItem 
                                                    onClick={() => handleStatusChange(rfc.id, 'IMPLEMENTED')}
                                                >
                                                    <TrendingUp className="mr-2 h-4 w-4" />
                                                    {t('requirements.rfc.markImplemented')}
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem 
                                                onClick={() => handleDelete(rfc.id)}
                                                className="text-red-600"
                                            >
                                                <Trash className="mr-2 h-4 w-4" />
                                                {t('requirements.delete')}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default RFCList;