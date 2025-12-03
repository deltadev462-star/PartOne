import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  LineChart,
  PieChart,
  Calendar,
  Users,
  Target,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Download,
  Filter,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Phone,
  Mail,
  Video
} from "lucide-react";

const StakeholderAnalytics = ({
  stakeholders,
  engagementLogs,
  analyticsData,
  projects
}) => {
  const { t } = useTranslation();
  const [selectedProject, setSelectedProject] = useState("all");
  const [timeRange, setTimeRange] = useState("30days");
  const [viewMode, setViewMode] = useState("overview"); // overview, sentiment, activity, engagement

  // Filter data based on selections
  const filteredStakeholders = useMemo(() => {
    if (selectedProject === "all") return stakeholders;
    return stakeholders.filter(s => s.projectId === selectedProject);
  }, [stakeholders, selectedProject]);

  const filteredLogs = useMemo(() => {
    let logs = engagementLogs;
    
    // Filter by project
    if (selectedProject !== "all") {
      const projectStakeholderIds = filteredStakeholders.map(s => s.id);
      logs = logs.filter(log => projectStakeholderIds.includes(log.stakeholderId));
    }
    
    // Filter by time range
    const now = new Date();
    const cutoffDate = new Date();
    
    switch(timeRange) {
      case "7days":
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case "30days":
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case "90days":
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case "1year":
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return logs;
    }
    
    return logs.filter(log => new Date(log.timestamp) >= cutoffDate);
  }, [engagementLogs, selectedProject, filteredStakeholders, timeRange]);

  // Calculate analytics metrics
  const metrics = useMemo(() => {
    const totalEngagements = filteredLogs.length;
    const uniqueStakeholders = new Set(filteredLogs.map(log => log.stakeholderId)).size;
    
    // Sentiment analysis
    const sentimentScores = filteredLogs.map(log => log.sentimentScore || 50);
    const avgSentiment = sentimentScores.length > 0 
      ? Math.round(sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length)
      : 0;
    
    const positiveLogs = filteredLogs.filter(log => (log.sentimentScore || 50) >= 70);
    const negativeLogs = filteredLogs.filter(log => (log.sentimentScore || 50) < 30);
    const neutralLogs = filteredLogs.filter(log => {
      const score = log.sentimentScore || 50;
      return score >= 30 && score < 70;
    });
    
    // Calculate trends
    const previousPeriodLogs = engagementLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      const now = new Date();
      const cutoffDate = new Date();
      const previousCutoff = new Date();
      
      switch(timeRange) {
        case "7days":
          cutoffDate.setDate(now.getDate() - 7);
          previousCutoff.setDate(now.getDate() - 14);
          break;
        case "30days":
          cutoffDate.setDate(now.getDate() - 30);
          previousCutoff.setDate(now.getDate() - 60);
          break;
        case "90days":
          cutoffDate.setDate(now.getDate() - 90);
          previousCutoff.setDate(now.getDate() - 180);
          break;
        case "1year":
          cutoffDate.setFullYear(now.getFullYear() - 1);
          previousCutoff.setFullYear(now.getFullYear() - 2);
          break;
        default:
          return false;
      }
      
      return logDate >= previousCutoff && logDate < cutoffDate;
    });
    
    const engagementTrend = totalEngagements > 0 && previousPeriodLogs.length > 0
      ? ((totalEngagements - previousPeriodLogs.length) / previousPeriodLogs.length * 100)
      : 0;
    
    // Engagement by method
    const byMethod = {};
    ["meeting", "call", "email", "video", "workshop", "presentation"].forEach(method => {
      byMethod[method] = filteredLogs.filter(log => log.method === method).length;
    });
    
    // Top engaged stakeholders
    const stakeholderEngagements = {};
    filteredLogs.forEach(log => {
      stakeholderEngagements[log.stakeholderId] = (stakeholderEngagements[log.stakeholderId] || 0) + 1;
    });
    
    const topStakeholders = Object.entries(stakeholderEngagements)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({
        stakeholder: stakeholders.find(s => s.id === id),
        count,
        percentage: Math.round(count / totalEngagements * 100)
      }));
    
    // Engagement quality scores
    const engagementScores = filteredStakeholders.map(stakeholder => {
      const stakeholderLogs = filteredLogs.filter(log => log.stakeholderId === stakeholder.id);
      const avgSentiment = stakeholderLogs.length > 0
        ? stakeholderLogs.reduce((sum, log) => sum + (log.sentimentScore || 50), 0) / stakeholderLogs.length
        : 50;
      
      const frequency = stakeholderLogs.length;
      const recency = stakeholderLogs.length > 0
        ? Math.max(...stakeholderLogs.map(log => new Date(log.timestamp).getTime()))
        : 0;
      
      const daysSinceLastEngagement = recency > 0
        ? Math.floor((Date.now() - recency) / (1000 * 60 * 60 * 24))
        : 999;
      
      const recencyScore = daysSinceLastEngagement <= 7 ? 100 
        : daysSinceLastEngagement <= 30 ? 75
        : daysSinceLastEngagement <= 90 ? 50
        : 25;
      
      const overallScore = (avgSentiment * 0.4 + Math.min(frequency * 10, 100) * 0.3 + recencyScore * 0.3);
      
      return {
        stakeholder,
        sentiment: Math.round(avgSentiment),
        frequency,
        recency: daysSinceLastEngagement,
        score: Math.round(overallScore)
      };
    }).sort((a, b) => b.score - a.score);
    
    return {
      totalEngagements,
      uniqueStakeholders,
      avgSentiment,
      sentimentDistribution: {
        positive: positiveLogs.length,
        neutral: neutralLogs.length,
        negative: negativeLogs.length
      },
      engagementTrend,
      byMethod,
      topStakeholders,
      engagementScores
    };
  }, [filteredLogs, filteredStakeholders, stakeholders, engagementLogs, timeRange]);

  // Generate time series data
  const timeSeriesData = useMemo(() => {
    const data = [];
    const now = new Date();
    const days = timeRange === "7days" ? 7 : timeRange === "30days" ? 30 : timeRange === "90days" ? 90 : 365;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayLogs = filteredLogs.filter(log => {
        const logDate = new Date(log.timestamp).toISOString().split('T')[0];
        return logDate === dateStr;
      });
      
      const avgSentiment = dayLogs.length > 0
        ? dayLogs.reduce((sum, log) => sum + (log.sentimentScore || 50), 0) / dayLogs.length
        : null;
      
      data.push({
        date: dateStr,
        engagements: dayLogs.length,
        sentiment: avgSentiment
      });
    }
    
    return data;
  }, [filteredLogs, timeRange]);

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-yellow-600 bg-yellow-50";
    if (score >= 40) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  };

  const exportAnalytics = () => {
    const csvContent = [
      ["Stakeholder Analytics Report"],
      ["Generated:", new Date().toLocaleString()],
      ["Time Range:", timeRange],
      [""],
      ["Summary Metrics"],
      ["Total Engagements:", metrics.totalEngagements],
      ["Unique Stakeholders:", metrics.uniqueStakeholders],
      ["Average Sentiment:", metrics.avgSentiment + "%"],
      ["Positive Engagements:", metrics.sentimentDistribution.positive],
      ["Neutral Engagements:", metrics.sentimentDistribution.neutral],
      ["Negative Engagements:", metrics.sentimentDistribution.negative],
      [""],
      ["Top Engaged Stakeholders"],
      ["Name", "Role", "Organization", "Engagements", "Sentiment", "Score"],
      ...metrics.engagementScores.slice(0, 10).map(item => [
        item.stakeholder?.name || "",
        item.stakeholder?.role || "",
        item.stakeholder?.organization || "",
        item.frequency,
        item.sentiment + "%",
        item.score
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stakeholder_analytics_${new Date().toISOString()}.csv`;
    a.click();
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-zinc-400">
              {t("stakeholders.analytics.totalEngagements")}
            </span>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{metrics.totalEngagements}</span>
            {metrics.engagementTrend !== 0 && (
              <span className={`text-sm flex items-center ${metrics.engagementTrend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {metrics.engagementTrend > 0 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {Math.abs(Math.round(metrics.engagementTrend))}%
              </span>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-zinc-400">
              {t("stakeholders.analytics.activeStakeholders")}
            </span>
            <Users className="w-5 h-5 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{metrics.uniqueStakeholders}</span>
            <span className="text-sm text-gray-500">
              / {filteredStakeholders.length}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-zinc-400">
              {t("stakeholders.analytics.avgSentiment")}
            </span>
            {metrics.avgSentiment >= 70 ? (
              <ThumbsUp className="w-5 h-5 text-green-500" />
            ) : metrics.avgSentiment >= 30 ? (
              <Minus className="w-5 h-5 text-yellow-500" />
            ) : (
              <ThumbsDown className="w-5 h-5 text-red-500" />
            )}
          </div>
          <span className="text-2xl font-bold">{metrics.avgSentiment}%</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-zinc-400">
              {t("stakeholders.analytics.engagementHealth")}
            </span>
            <Target className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
              <div
                className={`h-full rounded-full ${
                  metrics.avgSentiment >= 70 ? 'bg-green-500' 
                  : metrics.avgSentiment >= 30 ? 'bg-yellow-500' 
                  : 'bg-red-500'
                }`}
                style={{ width: `${metrics.avgSentiment}%` }}
              />
            </div>
            <span className="text-sm font-medium">
              {metrics.avgSentiment >= 70 ? t("stakeholders.analytics.healthy")
                : metrics.avgSentiment >= 30 ? t("stakeholders.analytics.moderate")
                : t("stakeholders.analytics.needsAttention")}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Trend Chart */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t("stakeholders.analytics.engagementTrend")}
          </h3>
          <div className="h-48">
            <div className="flex items-end gap-1 h-full">
              {timeSeriesData.slice(-30).map((day, index) => (
                <div
                  key={index}
                  className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition cursor-pointer relative group"
                  style={{ height: `${Math.max(day.engagements * 20, 2)}%` }}
                  title={`${day.date}: ${day.engagements} engagements`}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                    {day.date}: {day.engagements}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sentiment Distribution */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t("stakeholders.analytics.sentimentDistribution")}
          </h3>
          <div className="space-y-4">
            {[
              { 
                label: t("stakeholders.analytics.positive"), 
                value: metrics.sentimentDistribution.positive, 
                color: "bg-green-500",
                icon: ThumbsUp
              },
              { 
                label: t("stakeholders.analytics.neutral"), 
                value: metrics.sentimentDistribution.neutral, 
                color: "bg-yellow-500",
                icon: Minus
              },
              { 
                label: t("stakeholders.analytics.negative"), 
                value: metrics.sentimentDistribution.negative, 
                color: "bg-red-500",
                icon: ThumbsDown
              }
            ].map((item, index) => {
              const Icon = item.icon;
              const total = metrics.totalEngagements || 1;
              const percentage = Math.round(item.value / total * 100);
              
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-zinc-400">
                      {item.value} ({percentage}%)
                    </span>
                  </div>
                  <div className="bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Engagement by Method */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t("stakeholders.analytics.engagementByMethod")}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { method: "meeting", icon: Users, label: t("stakeholders.methods.meeting") },
            { method: "call", icon: Phone, label: t("stakeholders.methods.call") },
            { method: "email", icon: Mail, label: t("stakeholders.methods.email") },
            { method: "video", icon: Video, label: t("stakeholders.methods.video") },
            { method: "workshop", icon: Activity, label: t("stakeholders.methods.workshop") },
            { method: "presentation", icon: MessageSquare, label: t("stakeholders.methods.presentation") }
          ].map(({ method, icon: Icon, label }) => {
            const count = metrics.byMethod[method] || 0;
            const percentage = metrics.totalEngagements > 0
              ? Math.round(count / metrics.totalEngagements * 100)
              : 0;
            
            return (
              <div key={method} className="text-center">
                <div className="bg-gray-100 dark:bg-zinc-800 rounded-lg p-4 mb-2">
                  <Icon className="w-8 h-8 mx-auto mb-2 text-gray-600 dark:text-zinc-400" />
                  <p className="text-2xl font-bold">{count}</p>
                </div>
                <p className="text-xs text-gray-600 dark:text-zinc-400">
                  {label} ({percentage}%)
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderEngagementScores = () => (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg">
      <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t("stakeholders.analytics.engagementScores")}
        </h3>
        <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">
          {t("stakeholders.analytics.scoresDescription")}
        </p>
      </div>
      
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-zinc-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                {t("stakeholders.analytics.stakeholder")}
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                {t("stakeholders.analytics.engagements")}
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                {t("stakeholders.analytics.sentiment")}
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                {t("stakeholders.analytics.lastEngagement")}
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                {t("stakeholders.analytics.score")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
            {metrics.engagementScores.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm">
                      {item.stakeholder?.name?.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.stakeholder?.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-zinc-500">
                        {item.stakeholder?.role} • {item.stakeholder?.organization}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-sm font-medium">{item.frequency}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {item.sentiment >= 70 ? (
                      <ThumbsUp className="w-4 h-4 text-green-500" />
                    ) : item.sentiment >= 30 ? (
                      <Minus className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <ThumbsDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm">{item.sentiment}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`text-sm ${
                    item.recency <= 7 ? 'text-green-600'
                    : item.recency <= 30 ? 'text-yellow-600'
                    : 'text-red-600'
                  }`}>
                    {item.recency === 999 ? t("stakeholders.analytics.never")
                      : item.recency === 0 ? t("stakeholders.analytics.today")
                      : t("stakeholders.analytics.daysAgo", { days: item.recency })}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(item.score)}`}>
                    {item.score}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Mobile Card View */}
      <div className="md:hidden">
        <div className="grid grid-cols-1 gap-4 p-4">
          {metrics.engagementScores.map((item, index) => (
            <div key={index} className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-4 space-y-3">
              {/* Header with Stakeholder Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                    {item.stakeholder?.name?.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {item.stakeholder?.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-zinc-500">
                      {item.stakeholder?.role}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-zinc-500">
                      {item.stakeholder?.organization}
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(item.score)}`}>
                  {item.score}
                </div>
              </div>
              
              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-200 dark:border-zinc-700">
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-zinc-500 mb-1">
                    {t("stakeholders.analytics.engagements")}
                  </p>
                  <p className="text-lg font-bold">{item.frequency}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-zinc-500 mb-1">
                    {t("stakeholders.analytics.sentiment")}
                  </p>
                  <div className="flex items-center justify-center gap-1">
                    {item.sentiment >= 70 ? (
                      <ThumbsUp className="w-4 h-4 text-green-500" />
                    ) : item.sentiment >= 30 ? (
                      <Minus className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <ThumbsDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm font-medium">{item.sentiment}%</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-zinc-500 mb-1">
                    {t("stakeholders.analytics.lastEngagement")}
                  </p>
                  <p className={`text-sm font-medium ${
                    item.recency <= 7 ? 'text-green-600'
                    : item.recency <= 30 ? 'text-yellow-600'
                    : 'text-red-600'
                  }`}>
                    {item.recency === 999 ? t("stakeholders.analytics.never")
                      : item.recency === 0 ? t("stakeholders.analytics.today")
                      : t("stakeholders.analytics.daysAgo", { days: item.recency })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setViewMode("overview")}
            className={`px-4 py-2 text-sm rounded-md transition ${
              viewMode === "overview"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            {t("stakeholders.analytics.overview")}
          </button>
          <button
            onClick={() => setViewMode("engagement")}
            className={`px-4 py-2 text-sm rounded-md transition ${
              viewMode === "engagement"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
            }`}
          >
            <Target className="w-4 h-4 inline mr-2" />
            {t("stakeholders.analytics.engagementScores")}
          </button>
        </div>

        <div className="md:flex md:items-center gap-2">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 mb-3 md:mb-0 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
          >
            <option value="all">{t("stakeholders.analytics.allProjects")}</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
          >
            <option value="7days">{t("stakeholders.analytics.last7Days")}</option>
            <option value="30days">{t("stakeholders.analytics.last30Days")}</option>
            <option value="90days">{t("stakeholders.analytics.last90Days")}</option>
            <option value="1year">{t("stakeholders.analytics.lastYear")}</option>
          </select>

          <button
            onClick={exportAnalytics}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition"
            title={t("stakeholders.analytics.export")}
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === "overview" && renderOverviewTab()}
      {viewMode === "engagement" && renderEngagementScores()}
    </div>
  );
};

export default StakeholderAnalytics;