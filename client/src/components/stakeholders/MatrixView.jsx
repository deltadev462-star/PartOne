import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

const MatrixView = ({ showMatrixView, setShowMatrixView, getMatrixData, openStakeholderDetail }) => {
  const { t } = useTranslation();
  
  if (!showMatrixView) return null;

  const matrix = getMatrixData();
  
  return (
    <div className="fixed inset-0 backdrop-blur-xl bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t("stakeholders.matrix.title")}
            </h2>
            <button
              onClick={() => setShowMatrixView(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-4">
            {/* High Influence Row */}
            <div className="border-2 border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
              <h3 className="font-semibold text-sm text-red-700 dark:text-red-400 mb-3">
                {t("stakeholders.matrix.highInfluenceHighInterest")}
              </h3>
              <p className="text-xs text-red-600 dark:text-red-500 mb-2">{t("stakeholders.strategies.manageClosely")}</p>
              <div className="space-y-2">
                {matrix["high-high"].map((s) => (
                  <div
                    key={s.id}
                    onClick={() => openStakeholderDetail(s)}
                    className="p-2 bg-white dark:bg-zinc-800 rounded cursor-pointer hover:shadow-md transition"
                  >
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.role}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-2 border-orange-200 dark:border-orange-800 rounded-lg p-4 bg-orange-50 dark:bg-orange-900/20">
              <h3 className="font-semibold text-sm text-orange-700 dark:text-orange-400 mb-3">
                {t("stakeholders.matrix.highInfluenceMediumInterest")}
              </h3>
              <p className="text-xs text-orange-600 dark:text-orange-500 mb-2">{t("stakeholders.strategies.keepSatisfied")}</p>
              <div className="space-y-2">
                {matrix["high-medium"].map((s) => (
                  <div
                    key={s.id}
                    onClick={() => openStakeholderDetail(s)}
                    className="p-2 bg-white dark:bg-zinc-800 rounded cursor-pointer hover:shadow-md transition"
                  >
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.role}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-2 border-yellow-200 dark:border-yellow-800 rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20">
              <h3 className="font-semibold text-sm text-yellow-700 dark:text-yellow-400 mb-3">
                {t("stakeholders.matrix.highInfluenceLowInterest")}
              </h3>
              <p className="text-xs text-yellow-600 dark:text-yellow-500 mb-2">{t("stakeholders.strategies.keepSatisfied")}</p>
              <div className="space-y-2">
                {matrix["high-low"].map((s) => (
                  <div
                    key={s.id}
                    onClick={() => openStakeholderDetail(s)}
                    className="p-2 bg-white dark:bg-zinc-800 rounded cursor-pointer hover:shadow-md transition"
                  >
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.role}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Medium Influence Row */}
            <div className="border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
              <h3 className="font-semibold text-sm text-blue-700 dark:text-blue-400 mb-3">
                {t("stakeholders.matrix.mediumInfluenceHighInterest")}
              </h3>
              <p className="text-xs text-blue-600 dark:text-blue-500 mb-2">{t("stakeholders.strategies.keepInformed")}</p>
              <div className="space-y-2">
                {matrix["medium-high"].map((s) => (
                  <div
                    key={s.id}
                    onClick={() => openStakeholderDetail(s)}
                    className="p-2 bg-white dark:bg-zinc-800 rounded cursor-pointer hover:shadow-md transition"
                  >
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.role}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-2 border-purple-200 dark:border-purple-800 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
              <h3 className="font-semibold text-sm text-purple-700 dark:text-purple-400 mb-3">
                {t("stakeholders.matrix.mediumInfluenceMediumInterest")}
              </h3>
              <p className="text-xs text-purple-600 dark:text-purple-500 mb-2">{t("stakeholders.strategies.keepInformed")}</p>
              <div className="space-y-2">
                {matrix["medium-medium"].map((s) => (
                  <div
                    key={s.id}
                    onClick={() => openStakeholderDetail(s)}
                    className="p-2 bg-white dark:bg-zinc-800 rounded cursor-pointer hover:shadow-md transition"
                  >
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.role}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/20">
              <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-400 mb-3">
                {t("stakeholders.matrix.mediumInfluenceLowInterest")}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-500 mb-2">{t("stakeholders.strategies.monitor")}</p>
              <div className="space-y-2">
                {matrix["medium-low"].map((s) => (
                  <div
                    key={s.id}
                    onClick={() => openStakeholderDetail(s)}
                    className="p-2 bg-white dark:bg-zinc-800 rounded cursor-pointer hover:shadow-md transition"
                  >
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.role}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Low Influence Row */}
            <div className="border-2 border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
              <h3 className="font-semibold text-sm text-green-700 dark:text-green-400 mb-3">
                {t("stakeholders.matrix.lowInfluenceHighInterest")}
              </h3>
              <p className="text-xs text-green-600 dark:text-green-500 mb-2">{t("stakeholders.strategies.keepInformed")}</p>
              <div className="space-y-2">
                {matrix["low-high"].map((s) => (
                  <div
                    key={s.id}
                    onClick={() => openStakeholderDetail(s)}
                    className="p-2 bg-white dark:bg-zinc-800 rounded cursor-pointer hover:shadow-md transition"
                  >
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.role}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/20">
              <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-400 mb-3">
                {t("stakeholders.matrix.lowInfluenceMediumInterest")}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-500 mb-2">{t("stakeholders.strategies.monitor")}</p>
              <div className="space-y-2">
                {matrix["low-medium"].map((s) => (
                  <div
                    key={s.id}
                    onClick={() => openStakeholderDetail(s)}
                    className="p-2 bg-white dark:bg-zinc-800 rounded cursor-pointer hover:shadow-md transition"
                  >
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.role}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/20">
              <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-400 mb-3">
                {t("stakeholders.matrix.lowInfluenceLowInterest")}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-500 mb-2">{t("stakeholders.strategies.minimalEffort")}</p>
              <div className="space-y-2">
                {matrix["low-low"].map((s) => (
                  <div
                    key={s.id}
                    onClick={() => openStakeholderDetail(s)}
                    className="p-2 bg-white dark:bg-zinc-800 rounded cursor-pointer hover:shadow-md transition"
                  >
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.role}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Matrix Legend */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
            <h4 className="font-medium text-sm mb-2">{t("stakeholders.matrix.matrixAxes")}</h4>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="font-medium">{t("stakeholders.matrix.interestAxis")}</span>
              </div>
              <div>
                <span className="font-medium">{t("stakeholders.matrix.influenceAxis")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatrixView;