import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Badge,
    Button,
    Progress
} from '@/components/ui';
import {
    Calculator,
    TrendingUp,
    TrendingDown,
    Activity,
    AlertTriangle,
    BarChart3,
    Target,
    Settings,
    CheckCircle,
    XCircle,
    Clock,
    DollarSign,
    Users,
    Calendar,
    Lightbulb,
    FileText,
    Shield,
    ChevronRight
} from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const RiskAssessment = ({ risks, onUpdateRisk, isDark }) => {
    const { t } = useTranslation();
    const [selectedRisk, setSelectedRisk] = useState(null);
    const [assessmentMode, setAssessmentMode] = useState('qualitative'); // qualitative, quantitative
    const [showScoringEngine, setShowScoringEngine] = useState(false);
    
    // Risk assessment parameters
    const assessmentParameters = {
        likelihood: {
            RARE: { value: 1, probability: 0.05, description: 'Very unlikely to occur' },
            UNLIKELY: { value: 2, probability: 0.15, description: 'Unlikely but possible' },
            POSSIBLE: { value: 3, probability: 0.35, description: 'Could occur occasionally' },
            LIKELY: { value: 4, probability: 0.60, description: 'Will probably occur' },
            ALMOST_CERTAIN: { value: 5, probability: 0.85, description: 'Expected to occur' }
        },
        impact: {
            INSIGNIFICANT: { value: 1, cost: 1000, time: 1, scope: 'Minimal' },
            MINOR: { value: 2, cost: 10000, time: 7, scope: 'Minor' },
            MODERATE: { value: 3, cost: 50000, time: 30, scope: 'Moderate' },
            MAJOR: { value: 4, cost: 250000, time: 90, scope: 'Major' },
            CATASTROPHIC: { value: 5, cost: 1000000, time: 180, scope: 'Catastrophic' }
        }
    };
    
    // Calculate risk score
    const calculateRiskScore = (risk) => {
        const likelihood = assessmentParameters.likelihood[risk.likelihood]?.value || 0;
        const impact = assessmentParameters.impact[risk.impact || risk.severity]?.value || 0;
        return likelihood * impact * 4; // Scale to 0-100
    };
    
    // Calculate quantitative risk value
    const calculateQuantitativeValue = (risk) => {
        const probability = assessmentParameters.likelihood[risk.likelihood]?.probability || 0;
        const cost = assessmentParameters.impact[risk.impact || risk.severity]?.cost || 0;
        return Math.round(probability * cost);
    };
    
    // Group risks by assessment status
    const assessmentStatus = {
        assessed: risks.filter(r => r.riskScore && r.likelihood && r.impact),
        pending: risks.filter(r => !r.riskScore || !r.likelihood || !r.impact),
        needReview: risks.filter(r => {
            if (!r.lastAssessmentDate) return false;
            const daysSince = Math.floor((new Date() - new Date(r.lastAssessmentDate)) / (1000 * 60 * 60 * 24));
            return daysSince > 30;
        })
    };
    
    // Prepare radar chart data for selected risk
    const getRadarData = (risk) => {
        if (!risk) return [];
        
        return [
            { aspect: 'Technical', score: risk.technicalScore || Math.random() * 100 },
            { aspect: 'Schedule', score: risk.scheduleScore || Math.random() * 100 },
            { aspect: 'Cost', score: risk.costScore || Math.random() * 100 },
            { aspect: 'Quality', score: risk.qualityScore || Math.random() * 100 },
            { aspect: 'Resources', score: risk.resourceScore || Math.random() * 100 },
            { aspect: 'Compliance', score: risk.complianceScore || Math.random() * 100 }
        ];
    };
    
    // Risk scoring engine
    const ScoringEngine = ({ risk, onSave }) => {
        const [scores, setScores] = useState({
            likelihood: risk.likelihood || 'POSSIBLE',
            impact: risk.impact || risk.severity || 'MODERATE',
            detectability: risk.detectability || 'MEDIUM',
            velocity: risk.velocity || 'MEDIUM',
            interconnectedness: risk.interconnectedness || 'LOW',
            controlEffectiveness: risk.controlEffectiveness || 'MEDIUM'
        });
        
        const updateScore = (field, value) => {
            setScores({ ...scores, [field]: value });
        };
        
        const calculateCompositeScore = () => {
            const weights = {
                likelihood: 0.25,
                impact: 0.25,
                detectability: 0.15,
                velocity: 0.15,
                interconnectedness: 0.10,
                controlEffectiveness: 0.10
            };
            
            let totalScore = 0;
            // Calculate weighted score
            // This is simplified - in reality, each field would have its own scoring logic
            
            return Math.round(totalScore);
        };
        
        return (
            <Card className="border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        {t('riskManagement.scoringEngine')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Likelihood */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                {t('riskManagement.likelihood.label')}
                            </label>
                            <select
                                value={scores.likelihood}
                                onChange={(e) => updateScore('likelihood', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg ${
                                    isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                }`}
                            >
                                {Object.keys(assessmentParameters.likelihood).map(level => (
                                    <option key={level} value={level}>{level}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Impact */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                {t('riskManagement.impact.label')}
                            </label>
                            <select
                                value={scores.impact}
                                onChange={(e) => updateScore('impact', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg ${
                                    isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                }`}
                            >
                                {Object.keys(assessmentParameters.impact).map(level => (
                                    <option key={level} value={level}>{level}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Detectability */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                {t('riskManagement.detectability')}
                            </label>
                            <select
                                value={scores.detectability}
                                onChange={(e) => updateScore('detectability', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg ${
                                    isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                }`}
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>
                        
                        {/* Velocity */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                {t('riskManagement.velocity')}
                            </label>
                            <select
                                value={scores.velocity}
                                onChange={(e) => updateScore('velocity', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg ${
                                    isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                }`}
                            >
                                <option value="SLOW">Slow</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="FAST">Fast</option>
                            </select>
                        </div>
                        
                        {/* Interconnectedness */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                {t('riskManagement.interconnectedness')}
                            </label>
                            <select
                                value={scores.interconnectedness}
                                onChange={(e) => updateScore('interconnectedness', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg ${
                                    isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                }`}
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>
                        
                        {/* Control Effectiveness */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                {t('riskManagement.controlEffectiveness')}
                            </label>
                            <select
                                value={scores.controlEffectiveness}
                                onChange={(e) => updateScore('controlEffectiveness', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg ${
                                    isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                                }`}
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">{t('riskManagement.calculatedScore')}</p>
                                <p className="text-3xl font-bold">{calculateRiskScore(risk)}</p>
                            </div>
                            <Button
                                onClick={() => onSave(risk.id, { ...scores, riskScore: calculateRiskScore(risk) })}
                                className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                                {t('riskManagement.saveAssessment')}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };
    
    return (
        <div className="space-y-6">
            {/* Assessment Mode Selector */}
            <Card className="border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                <CardHeader>
                    <CardTitle>{t('riskManagement.assessmentMode')}</CardTitle>
                    <CardDescription>
                        {t('riskManagement.assessmentModeDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setAssessmentMode('qualitative')}
                            className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                                assessmentMode === 'qualitative'
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-300 dark:border-gray-600'
                            }`}
                        >
                            <BarChart3 className="h-6 w-6 mb-2" />
                            <h3 className="font-semibold">{t('riskManagement.qualitative')}</h3>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t('riskManagement.qualitativeDesc')}
                            </p>
                        </button>
                        
                        <button
                            onClick={() => setAssessmentMode('quantitative')}
                            className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                                assessmentMode === 'quantitative'
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-300 dark:border-gray-600'
                            }`}
                        >
                            <Calculator className="h-6 w-6 mb-2" />
                            <h3 className="font-semibold">{t('riskManagement.quantitative')}</h3>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {t('riskManagement.quantitativeDesc')}
                            </p>
                        </button>
                    </div>
                </CardContent>
            </Card>
            
            {/* Assessment Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('riskManagement.assessed')}
                                </p>
                                <p className="text-2xl font-bold">{assessmentStatus.assessed.length}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                        <Progress 
                            value={(assessmentStatus.assessed.length / risks.length) * 100}
                            className="mt-3"
                        />
                    </CardContent>
                </Card>
                
                <Card className="border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('riskManagement.pendingAssessment')}
                                </p>
                                <p className="text-2xl font-bold">{assessmentStatus.pending.length}</p>
                            </div>
                            <Clock className="h-8 w-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('riskManagement.needReview')}
                                </p>
                                <p className="text-2xl font-bold">{assessmentStatus.needReview.length}</p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {/* Risk Assessment List */}
            <Card className="border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>{t('riskManagement.riskAssessmentList')}</CardTitle>
                        <Button
                            onClick={() => setShowScoringEngine(!showScoringEngine)}
                            variant="outline"
                        >
                            <Settings className="h-4 w-4 mr-2" />
                            {t('riskManagement.scoringEngine')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {risks.map(risk => (
                            <div
                                key={risk.id}
                                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                                    selectedRisk?.id === risk.id
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                                onClick={() => setSelectedRisk(risk)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <p className="font-medium">{risk.riskId}</p>
                                            <Badge variant="outline">{risk.category}</Badge>
                                            {risk.riskScore ? (
                                                <Badge className="bg-green-500 text-white">
                                                    {t('riskManagement.assessed')}
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-yellow-500 text-white">
                                                    {t('riskManagement.pending')}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {risk.title}
                                        </p>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                                            <div>
                                                <p className="text-xs text-gray-500">{t('riskManagement.likelihood.label')}</p>
                                                <p className="font-medium">{risk.likelihood || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">{t('riskManagement.impact.label')}</p>
                                                <p className="font-medium">{risk.impact || risk.severity || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">{t('riskManagement.score')}</p>
                                                <p className="font-medium">{risk.riskScore || calculateRiskScore(risk)}</p>
                                            </div>
                                            {assessmentMode === 'quantitative' && (
                                                <div>
                                                    <p className="text-xs text-gray-500">{t('riskManagement.expectedValue')}</p>
                                                    <p className="font-medium">${calculateQuantitativeValue(risk).toLocaleString()}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <ChevronRight className="h-5 w-5 text-gray-400" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
            
            {/* Selected Risk Assessment Details */}
            {selectedRisk && showScoringEngine && (
                <ScoringEngine
                    risk={selectedRisk}
                    onSave={(id, data) => {
                        onUpdateRisk(id, data);
                        setSelectedRisk(null);
                        setShowScoringEngine(false);
                    }}
                />
            )}
            
            {/* Risk Profile Radar Chart */}
            {selectedRisk && (
                <Card className="border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                    <CardHeader>
                        <CardTitle>{t('riskManagement.riskProfile')}: {selectedRisk.riskId}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <RadarChart data={getRadarData(selectedRisk)}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="aspect" />
                                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                                <Radar
                                    name="Risk Score"
                                    dataKey="score"
                                    stroke="#3B82F6"
                                    fill="#3B82F6"
                                    fillOpacity={0.6}
                                />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default RiskAssessment;