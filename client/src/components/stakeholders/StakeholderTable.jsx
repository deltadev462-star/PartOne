import { useTranslation } from "react-i18next";
import { Mail, Phone, Eye, Edit2, Trash2 } from "lucide-react";

const StakeholderTable = ({
  filteredStakeholders,
  getEngagementStrategy,
  getInfluenceColor,
  openStakeholderDetail,
  setSelectedStakeholder,
  setShowCreateModal,
  deleteStakeholder
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredStakeholders.map((stakeholder) => {
          const strategy = getEngagementStrategy(stakeholder.influence, stakeholder.interest);
          return (
            <div
              key={stakeholder.id}
              className="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800 rounded-lg p-4 space-y-3"
            >
              {/* Header with Name and Actions */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                    {stakeholder.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <button
                      onClick={() => openStakeholderDetail(stakeholder)}
                      className="text-base font-semibold text-gray-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400"
                    >
                      {stakeholder.name}
                    </button>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">
                      {stakeholder.role}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openStakeholderDetail(stakeholder)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition"
                    title={t("stakeholders.viewDetails")}
                  >
                    <Eye className="size-4 text-gray-600 dark:text-zinc-400" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedStakeholder(stakeholder);
                      setShowCreateModal(true);
                    }}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition"
                    title={t("stakeholders.edit")}
                  >
                    <Edit2 className="size-4 text-gray-600 dark:text-zinc-400" />
                  </button>
                  <button
                    onClick={() => deleteStakeholder(stakeholder)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition"
                    title={t("stakeholders.delete")}
                  >
                    <Trash2 className="size-4 text-red-500 dark:text-red-400" />
                  </button>
                </div>
              </div>

              {/* Organization */}
              {stakeholder.organization && (
                <div className="text-sm">
                  <span className="font-medium text-gray-500 dark:text-zinc-400">
                    {t("stakeholders.organization")}:
                  </span>
                  <span className="ml-2 text-gray-900 dark:text-zinc-300">
                    {stakeholder.organization}
                  </span>
                </div>
              )}

              {/* Contact Info */}
              <div className="space-y-1">
                {stakeholder.email && (
                  <a
                    href={`mailto:${stakeholder.email}`}
                    className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                  >
                    <Mail className="size-3" />
                    {stakeholder.email}
                  </a>
                )}
                {stakeholder.phone && (
                  <span className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1">
                    <Phone className="size-3" />
                    {stakeholder.phone}
                  </span>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex px-2 py-1 text-xs rounded-md capitalize ${getInfluenceColor(
                    stakeholder.influence
                  )}`}
                >
                  {t("stakeholders.influence")}: {stakeholder.influence[0]}/{stakeholder.interest[0]}
                </span>
                <span className={`inline-flex px-2 py-1 text-xs rounded-md ${strategy.color}`}>
                  {strategy.strategy}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block w-full overflow-hidden rounded-md border border-gray-300 dark:border-zinc-800">
        <div className={`overflow-x-auto ${isRTL ? 'dir-rtl' : ''}`}>
          <table className={`w-full divide-y divide-gray-300 dark:divide-zinc-800 ${isRTL ? 'direction-rtl' : ''}`}>
            <thead className="bg-gray-50 dark:bg-zinc-900/50">
              <tr>
                <th className={`w-[20%] min-w-[150px] px-3 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-zinc-400 ${isRTL ? '' : 'uppercase'} tracking-wider`}>
                  {t("stakeholders.name")}
                </th>
                <th className={`w-[15%] min-w-[100px] px-3 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-zinc-400 ${isRTL ? '' : 'uppercase'} tracking-wider`}>
                  {t("stakeholders.organization")}
                </th>
                <th className={`w-[12%] min-w-[90px] px-3 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-zinc-400 ${isRTL ? '' : 'uppercase'} tracking-wider`}>
                  {t("stakeholders.role")}
                </th>
                <th className={`w-[20%] min-w-[150px] px-3 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-zinc-400 ${isRTL ? '' : 'uppercase'} tracking-wider`}>
                  {t("stakeholders.contact")}
                </th>
                <th className={`w-[10%] min-w-[80px] px-3 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-zinc-400 ${isRTL ? '' : 'uppercase'} tracking-wider`}>
                  {t("stakeholders.influenceInterest")}
                </th>
                <th className={`w-[16%] min-w-[150px] px-3 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-zinc-400 ${isRTL ? '' : 'uppercase'} tracking-wider`}>
                  {t("stakeholders.engagementLabel")}
                </th>
                <th className={`w-[10%] min-w-[90px] px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-zinc-400 ${isRTL ? '' : 'uppercase'} tracking-wider`}>
                  {t("stakeholders.actions")}
                </th>
              </tr>
            </thead>

            <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-300 dark:divide-zinc-800">
              {filteredStakeholders.map((stakeholder) => {
                const strategy = getEngagementStrategy(stakeholder.influence, stakeholder.interest);
                return (
                  <tr
                    key={stakeholder.id}
                    className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center">
                        <div className="size-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                          {stakeholder.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <button
                          onClick={() => openStakeholderDetail(stakeholder)}
                          className="mx-2 text-sm font-medium text-gray-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 truncate max-w-[120px]"
                          title={stakeholder.name}
                        >
                          {stakeholder.name}
                        </button>
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      <span className="text-sm text-gray-600 dark:text-zinc-300 block truncate" title={stakeholder.organization || "-"}>
                        {stakeholder.organization || "-"}
                      </span>
                    </td>

                    <td className="px-3 py-3">
                      <span className="text-sm text-gray-600 dark:text-zinc-300 block truncate" title={stakeholder.role}>
                        {stakeholder.role}
                      </span>
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-0.5">
                        {stakeholder.email && (
                          <a
                            href={`mailto:${stakeholder.email}`}
                            className="text-xs text-blue-500 hover:underline flex items-center gap-1 truncate"
                            title={stakeholder.email}
                          >
                            <Mail className="size-3 shrink-0" />
                            <span className="truncate">{stakeholder.email}</span>
                          </a>
                        )}
                        {stakeholder.phone && (
                          <span className="text-xs text-gray-600 dark:text-zinc-400 flex items-center gap-1" title={stakeholder.phone}>
                            <Phone className="size-3 shrink-0" />
                            {stakeholder.phone}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex px-1.5 py-0.5 text-xs rounded capitalize font-medium ${getInfluenceColor(
                          stakeholder.influence
                        )}`}
                      >
                        {stakeholder.influence[0].toUpperCase()}/{stakeholder.interest[0].toUpperCase()}
                      </span>
                    </td>

                    <td className="px-3 py-3">
                      <span className={`inline-flex px-1.5 py-0.5 text-xs rounded font-medium truncate max-w-[120px] ${strategy.color}`} title={strategy.strategy}>
                        {strategy.strategy}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <button
                          onClick={() => openStakeholderDetail(stakeholder)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition"
                          title={t("stakeholders.viewDetails")}
                        >
                          <Eye className="size-4 text-gray-600 dark:text-zinc-400" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStakeholder(stakeholder);
                            setShowCreateModal(true);
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition"
                          title={t("stakeholders.edit")}
                        >
                          <Edit2 className="size-4 text-gray-600 dark:text-zinc-400" />
                        </button>
                        <button
                          onClick={() => deleteStakeholder(stakeholder)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition"
                          title={t("stakeholders.delete")}
                        >
                          <Trash2 className="size-4 text-red-500 dark:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default StakeholderTable;