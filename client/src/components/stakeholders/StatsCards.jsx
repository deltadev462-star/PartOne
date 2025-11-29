import { useTranslation } from "react-i18next";
import { Users2Icon, Star, Building2, Target } from "lucide-react";

const StatsCards = ({ stakeholders, projects }) => {
  const { t } = useTranslation();
  
  const highInfluenceCount = stakeholders.filter(
    (s) => s.influence === "high"
  ).length;
  
  const uniqueOrganizations = [
    ...new Set(stakeholders.map((s) => s.organization).filter(Boolean)),
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-gray-300 dark:border-zinc-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              {t("stakeholders.totalStakeholders")}
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {stakeholders.length}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-500/10">
            <Users2Icon className="size-4 text-blue-500 dark:text-blue-200" />
          </div>
        </div>
      </div>

      <div className="dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-gray-300 dark:border-zinc-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              {t("stakeholders.highInfluence")}
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {highInfluenceCount}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-red-100 dark:bg-red-500/10">
            <Star className="size-4 text-red-500 dark:text-red-200" />
          </div>
        </div>
      </div>

      <div className="dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-gray-300 dark:border-zinc-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              {t("stakeholders.organizations")}
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {uniqueOrganizations.length}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-500/10">
            <Building2 className="size-4 text-purple-500 dark:text-purple-200" />
          </div>
        </div>
      </div>

      <div className="dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-gray-300 dark:border-zinc-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              {t("stakeholders.activeProjects")}
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {projects.length}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-green-100 dark:bg-green-500/10">
            <Target className="size-4 text-green-500 dark:text-green-200" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;