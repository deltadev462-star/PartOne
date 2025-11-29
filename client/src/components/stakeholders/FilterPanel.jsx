import { useTranslation } from "react-i18next";

const FilterPanel = ({ 
  showFilterPanel, 
  filters, 
  toggleFilter, 
  clearFilters,
  projects,
  stakeholders 
}) => {
  const { t } = useTranslation();

  if (!showFilterPanel) return null;

  const uniqueOrganizations = [
    ...new Set(stakeholders.map((s) => s.organization).filter(Boolean)),
  ];
  
  const uniqueCategories = ["internal", "external", "customer", "supplier", "regulatory"];

  return (
    <div className="p-4 border border-gray-200 dark:border-zinc-800 rounded-lg bg-gray-50 dark:bg-zinc-900/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900 dark:text-white">
          {t("stakeholders.filters")}
        </h3>
        <button
          onClick={clearFilters}
          className="text-sm text-blue-500 hover:underline"
        >
          {t("stakeholders.clearAll")}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
            {t("stakeholders.influence")}
          </p>
          <div className="space-y-2">
            {["high", "medium", "low"].map((level) => (
              <label key={level} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.influence.includes(level)}
                  onChange={() => toggleFilter("influence", level)}
                  className="mx-2"
                />
                <span className="text-sm capitalize">{t(`stakeholders.${level}`)}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
            {t("stakeholders.interest")}
          </p>
          <div className="space-y-2">
            {["high", "medium", "low"].map((level) => (
              <label key={level} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.interest.includes(level)}
                  onChange={() => toggleFilter("interest", level)}
                  className="mx-2"
                />
                <span className="text-sm capitalize">{t(`stakeholders.${level}`)}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
            {t("stakeholders.category")}
          </p>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {uniqueCategories.map((cat) => (
              <label key={cat} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.category.includes(cat)}
                  onChange={() => toggleFilter("category", cat)}
                  className="mx-2"
                />
                <span className="text-sm capitalize">{t(`stakeholders.categories.${cat}`)}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
            {t("stakeholders.projects")}
          </p>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {projects.map((project) => (
              <label key={project.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.project.includes(project.id)}
                  onChange={() => toggleFilter("project", project.id)}
                  className="mx-2"
                />
                <span className="text-sm">{project.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
            {t("stakeholders.organization")}
          </p>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {uniqueOrganizations.map((org) => (
              <label key={org} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.organization.includes(org)}
                  onChange={() => toggleFilter("organization", org)}
                  className="mx-2"
                />
                <span className="text-sm">{org}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;