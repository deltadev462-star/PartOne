import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  TrendingUp,
  Zap,
  Target,
  Users,
  Filter,
  Download,
  Maximize2,
  Info,
  ChevronRight,
  Circle
} from "lucide-react";

const PowerInterestHeatmap = ({
  stakeholders,
  projects,
  getMatrixData,
  openStakeholderDetail
}) => {
  const { t } = useTranslation();
  const [selectedProject, setSelectedProject] = useState("all");
  const [viewMode, setViewMode] = useState("heatmap"); // heatmap, quadrant, salience
  const [showLegend, setShowLegend] = useState(true);

  // Filter stakeholders by selected project
  const filteredStakeholders = useMemo(() => {
    if (selectedProject === "all") {
      return stakeholders;
    }
    return stakeholders.filter(s => s.projectId === selectedProject);
  }, [stakeholders, selectedProject]);

  // Calculate salience score for each stakeholder
  const calculateSalience = (stakeholder) => {
    const weights = {
      influence: { high: 3, medium: 2, low: 1 },
      interest: { high: 3, medium: 2, low: 1 },
      power: { high: 3, medium: 2, low: 1 },
      impact: { high: 3, medium: 2, low: 1 }
    };

    const score = 
      (weights.influence[stakeholder.influence] || 0) * 0.3 +
      (weights.interest[stakeholder.interest] || 0) * 0.3 +
      (weights.power[stakeholder.power || 'medium'] || 0) * 0.2 +
      (weights.impact[stakeholder.impact || 'medium'] || 0) * 0.2;

    return score / 3 * 100; // Normalize to 0-100
  };

  // Group stakeholders by quadrant
  const quadrantData = useMemo(() => {
    const quadrants = {
      "ManageClosely": [], // High Power, High Interest
      "KeepSatisfied": [], // High Power, Low Interest
      "KeepInformed": [], // Low Power, High Interest
      "Monitor": [] // Low Power, Low Interest
    };

    filteredStakeholders.forEach(stakeholder => {
      const salience = calculateSalience(stakeholder);
      const powerScore = stakeholder.power === 'high' ? 3 : stakeholder.power === 'medium' ? 2 : 1;
      const interestScore = stakeholder.interest === 'high' ? 3 : stakeholder.interest === 'medium' ? 2 : 1;

      const stakeholderData = { ...stakeholder, salience, powerScore, interestScore };

      if (powerScore >= 2.5 && interestScore >= 2.5) {
        quadrants["ManageClosely"].push(stakeholderData);
      } else if (powerScore >= 2.5 && interestScore < 2.5) {
        quadrants["KeepSatisfied"].push(stakeholderData);
      } else if (powerScore < 2.5 && interestScore >= 2.5) {
        quadrants["KeepInformed"].push(stakeholderData);
      } else {
        quadrants["Monitor"].push(stakeholderData);
      }
    });

    return quadrants;
  }, [filteredStakeholders]);

  // Calculate heatmap density
  const heatmapData = useMemo(() => {
    const grid = Array(10).fill(null).map(() => Array(10).fill(0));
    const stakeholderGrid = Array(10).fill(null).map(() => Array(10).fill(null).map(() => []));

    filteredStakeholders.forEach(stakeholder => {
      const powerMap = { high: 8, medium: 5, low: 2 };
      const interestMap = { high: 8, medium: 5, low: 2 };
      
      const x = Math.floor(interestMap[stakeholder.interest] || 5);
      const y = Math.floor(powerMap[stakeholder.power || 'medium']);
      
      // Add some random variation for better visualization
      const varX = Math.min(9, Math.max(0, x + Math.floor(Math.random() * 3 - 1)));
      const varY = Math.min(9, Math.max(0, y + Math.floor(Math.random() * 3 - 1)));
      
      grid[varY][varX]++;
      stakeholderGrid[varY][varX].push(stakeholder);
    });

    return { grid, stakeholderGrid };
  }, [filteredStakeholders]);

  const getHeatmapColor = (value, max) => {
    if (value === 0) return "bg-gray-100 dark:bg-zinc-800";
    const intensity = value / max;
    if (intensity > 0.75) return "bg-red-500";
    if (intensity > 0.5) return "bg-orange-400";
    if (intensity > 0.25) return "bg-yellow-400";
    return "bg-blue-400";
  };

  const getQuadrantStyle = (quadrant) => {
    switch(quadrant) {
      case "ManageClosely":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      case "KeepSatisfied":
        return "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800";
      case "KeepInformed":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
      case "Monitor":
        return "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800";
      default:
        return "";
    }
  };

  const getSalienceColor = (score) => {
    if (score >= 75) return "bg-red-500";
    if (score >= 50) return "bg-orange-400";
    if (score >= 25) return "bg-yellow-400";
    return "bg-green-400";
  };

  const exportData = () => {
    const csvContent = [
      ["Name", "Role", "Organization", "Power", "Interest", "Influence", "Impact", "Salience Score", "Quadrant"],
      ...filteredStakeholders.map(s => {
        const salience = calculateSalience(s);
        const quadrant = Object.entries(quadrantData).find(([_, stakeholders]) => 
          stakeholders.some(st => st.id === s.id)
        )?.[0] || "Unknown";
        
        return [
          s.name,
          s.role,
          s.organization || "",
          s.power || "medium",
          s.interest,
          s.influence,
          s.impact || "medium",
          Math.round(salience),
          quadrant
        ];
      })
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stakeholder_matrix_${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setViewMode("heatmap")}
            className={`px-4 py-2 text-sm rounded-md transition ${
              viewMode === "heatmap"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
            }`}
          >
            {t("stakeholders.heatmap.heatmapView")}
          </button>
          <button
            onClick={() => setViewMode("quadrant")}
            className={`px-4 py-2 text-sm rounded-md transition ${
              viewMode === "quadrant"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
            }`}
          >
            {t("stakeholders.heatmap.quadrantView")}
          </button>
          <button
            onClick={() => setViewMode("salience")}
            className={`px-4 py-2 text-sm rounded-md transition ${
              viewMode === "salience"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
            }`}
          >
            {t("stakeholders.heatmap.salienceView")}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
          >
            <option value="all">{t("stakeholders.heatmap.allProjects")}</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>

          <button
            onClick={() => setShowLegend(!showLegend)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition"
            title={t("stakeholders.heatmap.toggleLegend")}
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            onClick={exportData}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition"
            title={t("stakeholders.heatmap.export")}
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className={`${showLegend ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          {viewMode === "heatmap" && (
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t("stakeholders.heatmap.powerInterestHeatmap")}
              </h3>
              
              <div className="relative">
                {/* Y-axis label */}
                <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-sm text-gray-600 dark:text-zinc-400">
                  {t("stakeholders.heatmap.power")} →
                </div>
                
                {/* Grid */}
                <div className="grid grid-cols-10 gap-1">
                  {heatmapData.grid.map((row, y) => (
                    row.map((value, x) => (
                      <div
                        key={`${x}-${y}`}
                        className={`aspect-square ${getHeatmapColor(value, Math.max(...heatmapData.grid.flat()))} rounded cursor-pointer hover:opacity-80 transition relative group`}
                        onClick={() => {
                          if (heatmapData.stakeholderGrid[y][x].length > 0) {
                            openStakeholderDetail(heatmapData.stakeholderGrid[y][x][0]);
                          }
                        }}
                      >
                        {value > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-semibold">
                            {value}
                          </div>
                        )}
                        {heatmapData.stakeholderGrid[y][x].length > 0 && (
                          <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 whitespace-nowrap">
                            {heatmapData.stakeholderGrid[y][x].map(s => s.name).join(", ")}
                          </div>
                        )}
                      </div>
                    ))
                  ))}
                </div>
                
                {/* X-axis label */}
                <div className="text-center mt-2 text-sm text-gray-600 dark:text-zinc-400">
                  {t("stakeholders.heatmap.interest")} →
                </div>

                {/* Axis indicators */}
                <div className="absolute -bottom-8 left-0 right-0 flex justify-between text-xs text-gray-500">
                  <span>{t("stakeholders.low")}</span>
                  <span>{t("stakeholders.medium")}</span>
                  <span>{t("stakeholders.high")}</span>
                </div>
                <div className="absolute top-0 bottom-0 -right-12 flex flex-col justify-between text-xs text-gray-500">
                  <span>{t("stakeholders.high")}</span>
                  <span>{t("stakeholders.medium")}</span>
                  <span>{t("stakeholders.low")}</span>
                </div>
              </div>
            </div>
          )}

          {viewMode === "quadrant" && (
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t("stakeholders.heatmap.quadrantAnalysis")}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(quadrantData).map(([quadrant, stakeholdersList]) => (
                  <div
                    key={quadrant}
                    className={`border-2 rounded-lg p-4 ${getQuadrantStyle(quadrant)}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm">{t(`stakeholders.heatmap.quadrants.${quadrant}`)}</h4>
                      <span className="text-xs bg-white dark:bg-zinc-800 px-2 py-1 rounded">
                        {stakeholdersList.length} {t("stakeholders.heatmap.stakeholders")}
                      </span>
                    </div>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {stakeholdersList.length > 0 ? (
                        stakeholdersList.map((stakeholder) => (
                          <div
                            key={stakeholder.id}
                            onClick={() => openStakeholderDetail(stakeholder)}
                            className="p-2 bg-white dark:bg-zinc-800 rounded cursor-pointer hover:shadow-md transition flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs">
                                {stakeholder.name?.split(" ").map(n => n[0]).join("")}
                              </div>
                              <div>
                                <p className="text-xs font-medium">{stakeholder.name}</p>
                                <p className="text-xs text-gray-500">{stakeholder.role}</p>
                              </div>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${getSalienceColor(stakeholder.salience)}`} 
                                 title={`Salience: ${Math.round(stakeholder.salience)}%`} />
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-zinc-500 text-center py-4">
                          {t("stakeholders.heatmap.noStakeholdersInQuadrant")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === "salience" && (
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t("stakeholders.heatmap.salienceAnalysis")}
              </h3>
              
              <div className="space-y-4">
                {/* Salience distribution */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: t("stakeholders.heatmap.critical"), min: 75, max: 100, color: "bg-red-500" },
                    { label: t("stakeholders.heatmap.high"), min: 50, max: 75, color: "bg-orange-400" },
                    { label: t("stakeholders.heatmap.medium"), min: 25, max: 50, color: "bg-yellow-400" },
                    { label: t("stakeholders.heatmap.low"), min: 0, max: 25, color: "bg-green-400" }
                  ].map(level => {
                    const count = filteredStakeholders.filter(s => {
                      const salience = calculateSalience(s);
                      return salience >= level.min && salience < level.max;
                    }).length;
                    
                    return (
                      <div key={level.label} className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{level.label}</span>
                          <div className={`w-3 h-3 rounded-full ${level.color}`} />
                        </div>
                        <p className="text-2xl font-bold">{count}</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-500">
                          {level.min}-{level.max}%
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Stakeholder list sorted by salience */}
                <div className="space-y-2">
                  {filteredStakeholders
                    .map(s => ({ ...s, salience: calculateSalience(s) }))
                    .sort((a, b) => b.salience - a.salience)
                    .map(stakeholder => (
                      <div
                        key={stakeholder.id}
                        onClick={() => openStakeholderDetail(stakeholder)}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg hover:shadow-md cursor-pointer transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-8 rounded ${getSalienceColor(stakeholder.salience)}`} />
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm">
                            {stakeholder.name?.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{stakeholder.name}</p>
                            <p className="text-xs text-gray-500 dark:text-zinc-500">{stakeholder.role}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{Math.round(stakeholder.salience)}%</p>
                          <p className="text-xs text-gray-500 dark:text-zinc-500">{t('stakeholders.heatmap.salience')}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-3">{t("stakeholders.heatmap.legend")}</h4>
              
              {viewMode === "heatmap" && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 dark:text-zinc-400 mb-2">
                    {t("stakeholders.heatmap.densityIndicator")}
                  </p>
                  {[
                    { color: "bg-red-500", label: t("stakeholders.heatmap.veryHigh") },
                    { color: "bg-orange-400", label: t("stakeholders.heatmap.high") },
                    { color: "bg-yellow-400", label: t("stakeholders.heatmap.medium") },
                    { color: "bg-blue-400", label: t("stakeholders.heatmap.low") },
                    { color: "bg-gray-100 dark:bg-zinc-800", label: t("stakeholders.heatmap.none") }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${item.color}`} />
                      <span className="text-xs">{item.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {viewMode === "quadrant" && (
                <div className="space-y-3">
                  {Object.keys(quadrantData).map(quadrant => (
                    <div key={quadrant} className={`p-2 rounded ${getQuadrantStyle(quadrant)}`}>
                      <p className="text-xs font-medium">{t(`stakeholders.heatmap.quadrants.${quadrant}`)}</p>
                      <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">
                        {t(`stakeholders.heatmap.quadrantDescriptions.${quadrant}`)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {viewMode === "salience" && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 dark:text-zinc-400 mb-2">
                    {t("stakeholders.heatmap.salienceScore")}
                  </p>
                  <div className="text-xs space-y-1">
                    <p>• {t("stakeholders.heatmap.influenceWeight")}: 30%</p>
                    <p>• {t("stakeholders.heatmap.interestWeight")}: 30%</p>
                    <p>• {t("stakeholders.heatmap.powerWeight")}: 20%</p>
                    <p>• {t("stakeholders.heatmap.impactWeight")}: 20%</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2 text-blue-800 dark:text-blue-400">
                {t("stakeholders.heatmap.tips")}
              </h4>
              <ul className="text-xs text-blue-700 dark:text-blue-500 space-y-1">
                <li>• {t("stakeholders.heatmap.tip1")}</li>
                <li>• {t("stakeholders.heatmap.tip2")}</li>
                <li>• {t("stakeholders.heatmap.tip3")}</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PowerInterestHeatmap;