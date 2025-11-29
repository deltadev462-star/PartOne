import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Badge,
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider
} from '@/components/ui';
import {
    AlertTriangle,
    Info,
    TrendingUp,
    TrendingDown,
    Activity,
    Eye,
    Settings,
    Download
} from 'lucide-react';

const RiskMatrix = ({ risks, onSelectRisk, isDark }) => {
    const { t } = useTranslation();
    const [selectedCell, setSelectedCell] = useState(null);
    const [matrixSize, setMatrixSize] = useState('3x3'); // 3x3, 4x4, or 5x5
    
    // Likelihood levels (rows - from bottom to top)
    const likelihoodLevels5x5 = ['RARE', 'UNLIKELY', 'POSSIBLE', 'LIKELY', 'ALMOST_CERTAIN'];
    const likelihoodLevels3x3 = ['LOW', 'MEDIUM', 'HIGH'];
    
    // Impact/Severity levels (columns - from left to right)
    const impactLevels5x5 = ['INSIGNIFICANT', 'MINOR', 'MODERATE', 'MAJOR', 'CATASTROPHIC'];
    const impactLevels3x3 = ['LOW', 'MEDIUM', 'HIGH'];
    
    const likelihoodLevels = matrixSize === '3x3' ? likelihoodLevels3x3 : likelihoodLevels5x5;
    const impactLevels = matrixSize === '3x3' ? impactLevels3x3 : impactLevels5x5;
    
    // Map 5x5 values to 3x3
    const mapTo3x3 = (value, type) => {
        if (matrixSize !== '3x3') return value;
        
        if (type === 'likelihood') {
            if (value === 'RARE' || value === 'UNLIKELY') return 'LOW';
            if (value === 'POSSIBLE') return 'MEDIUM';
            if (value === 'LIKELY' || value === 'ALMOST_CERTAIN') return 'HIGH';
        }
        
        if (type === 'impact') {
            if (value === 'INSIGNIFICANT' || value === 'MINOR') return 'LOW';
            if (value === 'MODERATE') return 'MEDIUM';
            if (value === 'MAJOR' || value === 'CATASTROPHIC') return 'HIGH';
        }
        
        return value;
    };
    
    // Risk matrix color mapping
    const getRiskColor = (likelihood, impact) => {
        const likelihoodIndex = likelihoodLevels.indexOf(likelihood);
        const impactIndex = impactLevels.indexOf(impact);
        
        if (likelihoodIndex === -1 || impactIndex === -1) return 'bg-gray-100 dark:bg-gray-800';
        
        const score = (likelihoodIndex + 1) * (impactIndex + 1);
        const maxScore = likelihoodLevels.length * impactLevels.length;
        
        if (matrixSize === '3x3') {
            if (score <= 2) return 'bg-green-500';
            if (score <= 4) return 'bg-yellow-500';
            if (score <= 6) return 'bg-orange-500';
            return 'bg-red-500';
        } else {
            if (score <= 4) return 'bg-green-500';
            if (score <= 9) return 'bg-yellow-500';
            if (score <= 16) return 'bg-orange-500';
            return 'bg-red-500';
        }
    };
    
    // Get risk level label
    const getRiskLevel = (likelihood, impact) => {
        const likelihoodIndex = likelihoodLevels.indexOf(likelihood);
        const impactIndex = impactLevels.indexOf(impact);
        
        if (likelihoodIndex === -1 || impactIndex === -1) return 'UNKNOWN';
        
        const score = (likelihoodIndex + 1) * (impactIndex + 1);
        const maxScore = likelihoodLevels.length * impactLevels.length;
        
        if (matrixSize === '3x3') {
            if (score <= 2) return 'LOW';
            if (score <= 4) return 'MEDIUM';
            if (score <= 6) return 'HIGH';
            return 'CRITICAL';
        } else {
            if (score <= 4) return 'LOW';
            if (score <= 9) return 'MEDIUM';
            if (score <= 16) return 'HIGH';
            return 'CRITICAL';
        }
    };
    
    // Group risks by cell
    const getRisksByCell = () => {
        const riskMap = {};
        
        risks.forEach(risk => {
            const likelihood = mapTo3x3(risk.likelihood, 'likelihood');
            const impact = mapTo3x3(risk.impact || risk.severity, 'impact');
            const key = `${likelihood}-${impact}`;
            
            if (!riskMap[key]) {
                riskMap[key] = [];
            }
            riskMap[key].push(risk);
        });
        
        return riskMap;
    };
    
    const risksByCell = getRisksByCell();
    
    // Calculate statistics
    const getMatrixStats = () => {
        const stats = {
            total: risks.length,
            byLevel: {
                LOW: 0,
                MEDIUM: 0,
                HIGH: 0,
                CRITICAL: 0
            }
        };
        
        risks.forEach(risk => {
            const likelihood = mapTo3x3(risk.likelihood, 'likelihood');
            const impact = mapTo3x3(risk.impact || risk.severity, 'impact');
            const level = getRiskLevel(likelihood, impact);
            stats.byLevel[level]++;
        });
        
        return stats;
    };
    
    const stats = getMatrixStats();
    
    const handleCellClick = (likelihood, impact) => {
        const key = `${likelihood}-${impact}`;
        setSelectedCell(selectedCell === key ? null : key);
    };
    
    const exportMatrix = () => {
        // Create matrix data for export
        const matrixData = [];
        
        // Add header row
        matrixData.push(['Risk Matrix', ...impactLevels.map(impact =>
            t(`riskManagement.impact.${impact.toLowerCase().replace('_', '')}`)
        )]);
        
        // Add each likelihood row (reversed to match visual display)
        [...likelihoodLevels].reverse().forEach((likelihood) => {
            const row = [t(`riskManagement.likelihood.${likelihood.toLowerCase().replace('_', '')}`)];
            
            impactLevels.forEach(impact => {
                const key = `${likelihood}-${impact}`;
                const cellRisks = risksByCell[key] || [];
                const riskLevel = getRiskLevel(likelihood, impact);
                
                if (cellRisks.length > 0) {
                    const riskIds = cellRisks.map(r => r.riskId).join(', ');
                    row.push(`${riskLevel} (${cellRisks.length}): ${riskIds}`);
                } else {
                    row.push(riskLevel);
                }
            });
            
            matrixData.push(row);
        });
        
        // Convert to CSV
        const csvContent = matrixData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `risk-matrix-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    
    return (
        <div className="space-y-6">
            {/* Controls and Statistics - Responsive */}
            <div className="flex flex-col gap-4">
                {/* Settings Card */}
                <Card className="border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base sm:text-lg">{t('riskManagement.matrixSettings')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          
                            <button
                                onClick={exportMatrix}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-1.5 text-xs sm:text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span>{t('riskManagement.exportMatrix')}</span>
                            </button>
                        </div>
                    </CardContent>
                </Card>
                
                {/* Statistics Card */}
                <Card className="border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base sm:text-lg">{t('riskManagement.matrixStats')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div className="text-center">
                                <div className="w-full h-10 sm:h-8 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                    {stats.byLevel.LOW}
                                </div>
                                <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">{t('riskManagement.low')}</p>
                            </div>
                            <div className="text-center">
                                <div className="w-full h-10 sm:h-8 bg-yellow-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                    {stats.byLevel.MEDIUM}
                                </div>
                                <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">{t('riskManagement.medium')}</p>
                            </div>
                            <div className="text-center">
                                <div className="w-full h-10 sm:h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                    {stats.byLevel.HIGH}
                                </div>
                                <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">{t('riskManagement.high')}</p>
                            </div>
                            <div className="text-center">
                                <div className="w-full h-10 sm:h-8 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                    {stats.byLevel.CRITICAL}
                                </div>
                                <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">{t('riskManagement.critical')}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {/* Risk Matrix */}
            <Card className="  dark:border-gray-900 border-gray-200 hidden sm:block">
                <CardHeader>
                    <CardTitle>{t('riskManagement.riskMatrix')}</CardTitle>
                    <CardDescription>
                        {t('riskManagement.riskMatrixDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-2 sm:p-4">
                    <div className="overflow-x-auto overflow-y-hidden">
                        <div className="min-w-[400px] sm:min-w-[600px]">
                            {/* Matrix Grid */}
                            <div className="relative">
                                {/* Y-axis label - Hidden on mobile */}
                                <div className="hidden sm:block absolute -left-16 lg:-left-20 top-1/2 -translate-y-1/2 -rotate-90 text-xs lg:text-sm font-medium whitespace-nowrap">
                                    {t('riskManagement.likelihood.label')} →
                                </div>
                                
                                {/* Matrix */}
                                <div className="ml-0 sm:ml-16 lg:ml-24">
                                    {/* Header row */}
                                    <div className="flex">
                                        <div className="w-12 sm:w-16 lg:w-20 h-10 sm:h-12"></div>
                                        {impactLevels.map(impact => (
                                            <div key={impact} className="flex-1 h-10 sm:h-12 flex items-center justify-center text-[9px] sm:text-xs font-medium text-center px-0.5 sm:px-1">
                                                <span className="hidden sm:inline">{t(`riskManagement.impact.${impact.toLowerCase().replace('_', '')}`)}</span>
                                                <span className="sm:hidden">
                                                    {matrixSize === '3x3'
                                                        ? impact.charAt(0)
                                                        : impact.slice(0,2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Matrix rows (reversed to show high likelihood at top) */}
                                    {[...likelihoodLevels].reverse().map((likelihood, rowIndex) => (
                                        <div key={likelihood} className="flex">
                                            {/* Row label */}
                                            <div className="w-12 sm:w-16 lg:w-20 h-14 sm:h-16 lg:h-20 flex items-center justify-end pr-1 sm:pr-2 text-[9px] sm:text-xs font-medium">
                                                <span className="hidden sm:inline text-right">{t(`riskManagement.likelihood.${likelihood.toLowerCase().replace('_', '')}`)}</span>
                                                <span className="sm:hidden">
                                                    {matrixSize === '3x3'
                                                        ? likelihood.charAt(0)
                                                        : likelihood.slice(0,2)}
                                                </span>
                                            </div>
                                            
                                            {/* Matrix cells */}
                                            {impactLevels.map(impact => {
                                                const cellKey = `${likelihood}-${impact}`;
                                                const cellRisks = risksByCell[cellKey] || [];
                                                const riskColor = getRiskColor(likelihood, impact);
                                                const isSelected = selectedCell === cellKey;
                                                
                                                return (
                                                    <TooltipProvider key={cellKey}>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div
                                                                    className={`flex-1 h-14 sm:h-16 lg:h-20 border border-gray-300 dark:border-gray-600
                                                                        ${riskColor} ${cellRisks.length > 0 ? 'cursor-pointer hover:opacity-80' : ''}
                                                                        ${isSelected ? 'ring-2 ring-blue-500' : ''}
                                                                        relative flex items-center justify-center transition-all
                                                                        min-w-[50px] sm:min-w-[60px] lg:min-w-[80px]`}
                                                                    onClick={() => cellRisks.length > 0 && handleCellClick(likelihood, impact)}
                                                                >
                                                                    {cellRisks.length > 0 && (
                                                                        <>
                                                                            <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1">
                                                                                <Badge className="bg-white dark:bg-gray-800 text-black dark:text-white text-[9px] sm:text-[10px] px-0.5 sm:px-1 h-3.5 sm:h-4">
                                                                                    {cellRisks.length}
                                                                                </Badge>
                                                                            </div>
                                                                            <div className="flex flex-wrap gap-0.5 p-0.5 sm:p-1 justify-center">
                                                                                {cellRisks.slice(0, matrixSize === '3x3' ? 1 : 2).map((risk, idx) => (
                                                                                    <div
                                                                                        key={idx}
                                                                                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white dark:bg-gray-800 rounded-full"
                                                                                    />
                                                                                ))}
                                                                                {cellRisks.length > (matrixSize === '3x3' ? 1 : 2) && (
                                                                                    <span className="text-[8px] sm:text-[10px] text-white font-bold">
                                                                                        +{cellRisks.length - (matrixSize === '3x3' ? 1 : 2)}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <div className="space-y-1">
                                                                    <p className="font-semibold">
                                                                        {t('riskManagement.likelihood.label')}: {t(`riskManagement.likelihood.${likelihood.toLowerCase().replace('_', '')}`)}
                                                                    </p>
                                                                    <p className="font-semibold">
                                                                        {t('riskManagement.impact.label')}: {t(`riskManagement.impact.${impact.toLowerCase().replace('_', '')}`)}
                                                                    </p>
                                                                    <p className="font-semibold">
                                                                        {t('riskManagement.riskLevel.label')}: {t(`riskManagement.riskLevel.${getRiskLevel(likelihood, impact).toLowerCase()}`)}
                                                                    </p>
                                                                    {cellRisks.length > 0 && (
                                                                        <>
                                                                            <hr className="my-2" />
                                                                            <p className="font-semibold">{t('riskManagement.risksInCell')}:</p>
                                                                            {cellRisks.slice(0, 5).map((risk, idx) => (
                                                                                <p key={idx} className="text-sm">• {risk.riskId}: {risk.title}</p>
                                                                            ))}
                                                                            {cellRisks.length > 5 && (
                                                                                <p className="text-sm italic">
                                                                                    {t('riskManagement.andMore', { count: cellRisks.length - 5 })}
                                                                                </p>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                );
                                            })}
                                        </div>
                                    ))}
                                    
                                    {/* X-axis label - Simplified for mobile */}
                                    <div className="flex justify-center mt-2 sm:mt-4">
                                        <span className="text-[10px] sm:text-xs lg:text-sm font-medium">
                                            {t('riskManagement.impact.label')} →
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Legend - Responsive Grid */}
                            <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 px-2 sm:px-0">
                                <div className="flex items-center gap-1.5 sm:gap-2 justify-center sm:justify-start">
                                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded"></div>
                                    <span className="text-[11px] sm:text-xs">{t('riskManagement.low')}</span>
                                </div>
                                <div className="flex items-center gap-1.5 sm:gap-2 justify-center sm:justify-start">
                                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded"></div>
                                    <span className="text-[11px] sm:text-xs">{t('riskManagement.medium')}</span>
                                </div>
                                <div className="flex items-center gap-1.5 sm:gap-2 justify-center sm:justify-start">
                                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-orange-500 rounded"></div>
                                    <span className="text-[11px] sm:text-xs">{t('riskManagement.high')}</span>
                                </div>
                                <div className="flex items-center gap-1.5 sm:gap-2 justify-center sm:justify-start">
                                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded"></div>
                                    <span className="text-[11px] sm:text-xs">{t('riskManagement.critical')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            {/* Selected Cell Risks */}
            {selectedCell && risksByCell[selectedCell] && risksByCell[selectedCell].length > 0 && (
                <Card className="border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                    <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                        <CardTitle className="text-sm sm:text-base lg:text-lg">
                            {t('riskManagement.risksInSelectedCell')} ({risksByCell[selectedCell].length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6">
                        <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-96 overflow-y-auto">
                            {risksByCell[selectedCell].map(risk => (
                                <div
                                    key={risk.id}
                                    className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-md sm:rounded-lg border dark:border-gray-700
                                               hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                                    onClick={() => onSelectRisk(risk)}
                                >
                                    <AlertTriangle className={`h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 flex-shrink-0 mt-0.5 ${
                                        risk.riskLevel === 'CRITICAL' ? 'text-red-500' :
                                        risk.riskLevel === 'HIGH' ? 'text-orange-500' :
                                        risk.riskLevel === 'MEDIUM' ? 'text-yellow-500' :
                                        'text-green-500'
                                    }`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-1 sm:gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-xs sm:text-sm lg:text-base truncate">{risk.riskId}</p>
                                                <p className={`text-[11px] sm:text-xs lg:text-sm line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {risk.title}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 flex-shrink-0">
                                                {risk.trend === 'INCREASING' && <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 text-red-500" />}
                                                {risk.trend === 'DECREASING' && <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 text-green-500" />}
                                                {risk.trend === 'STABLE' && <Activity className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 text-gray-500" />}
                                                <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 text-blue-500" />
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 lg:gap-2 mt-1.5 sm:mt-2">
                                            <Badge className={`${getRiskColor(risk.likelihood, risk.impact || risk.severity)} text-white text-[9px] sm:text-[10px] lg:text-xs px-1 sm:px-1.5 h-4 sm:h-5`}>
                                                {getRiskLevel(risk.likelihood, risk.impact || risk.severity)}
                                            </Badge>
                                            <Badge variant="outline" className="text-[9px] sm:text-[10px] lg:text-xs px-1 sm:px-1.5 h-4 sm:h-5">
                                                {risk.category}
                                            </Badge>
                                            <Badge variant="outline" className="text-[9px] sm:text-[10px] lg:text-xs px-1 sm:px-1.5 h-4 sm:h-5">
                                                {risk.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default RiskMatrix;