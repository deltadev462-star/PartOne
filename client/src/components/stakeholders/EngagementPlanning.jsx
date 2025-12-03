import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  Clock,
  User,
  Target,
  AlertCircle,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Phone,
  Mail,
  Video,
  Users,
  FileText,
  Bell,
  CalendarCheck,
  RefreshCw
} from "lucide-react";

const EngagementPlanning = ({
  stakeholders,
  engagementPlans,
  projects,
  onCreatePlan,
  onUpdatePlan
}) => {
  const { t } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [selectedStakeholder, setSelectedStakeholder] = useState("");
  const [viewMode, setViewMode] = useState("calendar"); // calendar, list, timeline
  const [filterStatus, setFilterStatus] = useState("all"); // all, active, scheduled, completed, overdue

  const [planForm, setPlanForm] = useState({
    stakeholderId: "",
    objective: "",
    method: "meeting",
    frequency: "monthly",
    nextActionDate: new Date().toISOString().split('T')[0],
    owner: "",
    description: "",
    expectedOutcome: "",
    priority: "medium",
    reminderDays: 3,
    tags: [],
    status: "scheduled"
  });

  // Get current user info (mock for now)
  const currentUser = {
    name: t('stakeholders.currentUser'),
    email: t('stakeholders.userEmail')
  };

  useEffect(() => {
    if (editingPlan) {
      setPlanForm({
        stakeholderId: editingPlan.stakeholderId,
        objective: editingPlan.objective,
        method: editingPlan.method,
        frequency: editingPlan.frequency,
        nextActionDate: editingPlan.nextActionDate,
        owner: editingPlan.owner,
        description: editingPlan.description || "",
        expectedOutcome: editingPlan.expectedOutcome || "",
        priority: editingPlan.priority || "medium",
        reminderDays: editingPlan.reminderDays || 3,
        tags: editingPlan.tags || [],
        status: editingPlan.status || "scheduled"
      });
    }
  }, [editingPlan]);

  const engagementMethods = [
    { value: "meeting", label: t("stakeholders.engagement.methods.meeting"), icon: Users },
    { value: "call", label: t("stakeholders.engagement.methods.call"), icon: Phone },
    { value: "email", label: t("stakeholders.engagement.methods.email"), icon: Mail },
    { value: "video", label: t("stakeholders.engagement.methods.video"), icon: Video },
    { value: "workshop", label: t("stakeholders.engagement.methods.workshop"), icon: FileText },
    { value: "presentation", label: t("stakeholders.engagement.methods.presentation"), icon: Target }
  ];

  const frequencies = [
    { value: "daily", label: t("stakeholders.frequencies.daily") },
    { value: "weekly", label: t("stakeholders.frequencies.weekly") },
    { value: "bi-weekly", label: t("stakeholders.frequencies.biWeekly") },
    { value: "monthly", label: t("stakeholders.frequencies.monthly") },
    { value: "quarterly", label: t("stakeholders.frequencies.quarterly") },
    { value: "semi-annually", label: t("stakeholders.frequencies.semiAnnually") },
    { value: "annually", label: t("stakeholders.frequencies.annually") },
    { value: "as-needed", label: t("stakeholders.frequencies.asNeeded") }
  ];

  const priorities = [
    { value: "critical", label: t("stakeholders.priorities.critical"), color: "text-red-600 bg-red-50" },
    { value: "high", label: t("stakeholders.priorities.high"), color: "text-orange-600 bg-orange-50" },
    { value: "medium", label: t("stakeholders.priorities.medium"), color: "text-yellow-600 bg-yellow-50" },
    { value: "low", label: t("stakeholders.priorities.low"), color: "text-green-600 bg-green-50" }
  ];

  const handleCreateOrUpdate = () => {
    if (editingPlan) {
      onUpdatePlan(editingPlan.id, planForm);
      setEditingPlan(null);
    } else {
      onCreatePlan({
        ...planForm,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.name
      });
    }
    
    // Reset form
    setPlanForm({
      stakeholderId: "",
      objective: "",
      method: "meeting",
      frequency: "monthly",
      nextActionDate: new Date().toISOString().split('T')[0],
      owner: "",
      description: "",
      expectedOutcome: "",
      priority: "medium",
      reminderDays: 3,
      tags: [],
      status: "scheduled"
    });
    setShowCreateModal(false);
  };

  const getStatusColor = (status, dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const daysUntilDue = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (status === "completed") return "text-green-600 bg-green-50";
    if (daysUntilDue < 0) return "text-red-600 bg-red-50";
    if (daysUntilDue <= 3) return "text-orange-600 bg-orange-50";
    return "text-blue-600 bg-blue-50";
  };

  const getStatusLabel = (status, dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const daysUntilDue = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (status === "completed") return t("stakeholders.engagement.completed");
    if (daysUntilDue < 0) return t("stakeholders.engagement.overdue", { days: Math.abs(daysUntilDue) });
    if (daysUntilDue === 0) return t("stakeholders.engagement.dueToday");
    if (daysUntilDue <= 3) return t("stakeholders.engagement.dueSoon", { days: daysUntilDue });
    return t("stakeholders.engagement.scheduled");
  };

  const filteredPlans = engagementPlans.filter(plan => {
    if (filterStatus === "all") return true;
    
    const today = new Date();
    const due = new Date(plan.nextActionDate);
    const daysUntilDue = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    
    switch(filterStatus) {
      case "active":
        return plan.status !== "completed" && daysUntilDue >= 0;
      case "scheduled":
        return plan.status === "scheduled";
      case "completed":
        return plan.status === "completed";
      case "overdue":
        return daysUntilDue < 0 && plan.status !== "completed";
      default:
        return true;
    }
  });

  // Group plans by date for calendar view
  const plansByDate = filteredPlans.reduce((acc, plan) => {
    const date = plan.nextActionDate.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(plan);
    return acc;
  }, {});

  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Add previous month's trailing days
    const startDay = firstDay.getDay();
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }

    // Add current month's days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }

    // Add next month's leading days
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false });
    }

    return days;
  };

  const renderCalendarView = () => {
    const days = generateCalendarDays();
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-3 md:p-6">
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-0.5 md:gap-1 min-w-[30px]">
          {/* Week day headers */}
          {weekDays.map(day => (
            <div key={day} className="text-center py-1 md:py-2 text-xs md:text-sm font-medium text-gray-700 dark:text-zinc-300">
              {t(`stakeholders.weekDays.${day.toLowerCase()}`).slice(0, 3)}
            </div>
          ))}
          
          {/* Calendar days */}
          {days.map(({ date, isCurrentMonth }, index) => {
            const dateStr = date.toISOString().split('T')[0];
            const dayPlans = plansByDate[dateStr] || [];
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            
            return (
              <div
                key={index}
                className={`
                  min-h-[60px] md:min-h-[100px] p-1 md:p-2 border border-gray-100 dark:border-zinc-800 rounded
                  ${isCurrentMonth ? 'bg-white dark:bg-zinc-900' : 'bg-gray-50 dark:bg-zinc-950'}
                  ${isToday ? 'ring-1 md:ring-2 ring-blue-500' : ''}
                `}
              >
                <div className="flex justify-between items-start mb-0.5 md:mb-1">
                  <span className={`text-xs md:text-sm ${isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-zinc-600'}`}>
                    {date.getDate()}
                  </span>
                  {dayPlans.length > 0 && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-0.5 md:px-1 rounded">
                      {dayPlans.length}
                    </span>
                  )}
                </div>
                
                <div className="space-y-0.5 md:space-y-1">
                  {dayPlans.slice(0, 2).map((plan, idx) => {
                    const stakeholder = stakeholders.find(s => s.id === plan.stakeholderId);
                    const Method = engagementMethods.find(m => m.value === plan.method)?.icon || Users;
                    
                    return (
                      <div
                        key={idx}
                        className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition ${getStatusColor(plan.status, plan.nextActionDate)}`}
                        onClick={() => {
                          setEditingPlan(plan);
                          setShowCreateModal(true);
                        }}
                      >
                        <div className="flex items-center gap-0.5 md:gap-1">
                          <Method className="w-3 h-3 hidden md:block" />
                          <span className="truncate text-xs">{stakeholder?.name?.split(' ')[0]}</span>
                        </div>
                      </div>
                    );
                  })}
                  {dayPlans.length > 2 && (
                    <span className="text-xs text-gray-500 dark:text-zinc-500">
                      +{dayPlans.length - 2}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>
    );
  };

  const renderListView = () => (
    <div className="space-y-4">
      {filteredPlans.length > 0 ? (
        filteredPlans.map(plan => {
          const stakeholder = stakeholders.find(s => s.id === plan.stakeholderId);
          const Method = engagementMethods.find(m => m.value === plan.method)?.icon || Users;
          const priority = priorities.find(p => p.value === plan.priority);
          
          return (
            <div
              key={plan.id}
              className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm">
                      {stakeholder?.name?.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {stakeholder?.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-zinc-400">
                        {stakeholder?.role}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${priority?.color}`}>
                      {priority?.label}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(plan.status, plan.nextActionDate)}`}>
                      {getStatusLabel(plan.status, plan.nextActionDate)}
                    </span>
                  </div>
                  
                  <div className="space-y-2 ml-13">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700 dark:text-zinc-300">{plan.objective}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Method className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-zinc-400">
                          {engagementMethods.find(m => m.value === plan.method)?.label}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-zinc-400">
                          {frequencies.find(f => f.value === plan.frequency)?.label}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-zinc-400">
                          {new Date(plan.nextActionDate).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-zinc-400">
                          {plan.owner}
                        </span>
                      </div>
                    </div>
                    
                    {plan.description && (
                      <p className="text-sm text-gray-600 dark:text-zinc-400">
                        {plan.description}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {plan.reminderDays > 0 && (
                    <div className="flex items-center gap-1 text-gray-500" title={t("stakeholders.engagement.reminderSet")}>
                      <Bell className="w-4 h-4" />
                      <span className="text-xs">{plan.reminderDays}d</span>
                    </div>
                  )}
                  
                  <button
                    onClick={() => {
                      setEditingPlan(plan);
                      setShowCreateModal(true);
                    }}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition"
                  >
                    <Edit className="w-4 h-4 text-gray-600 dark:text-zinc-400" />
                  </button>
                  
                  {plan.status !== "completed" && (
                    <button
                      onClick={() => onUpdatePlan(plan.id, { ...plan, status: "completed" })}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition"
                    >
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 dark:text-zinc-500">
            {t("stakeholders.engagement.noPlans")}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-4 py-2 text-sm rounded-md transition ${
              viewMode === "calendar"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            {t("stakeholders.planning.engagement.calendarView")}
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 text-sm rounded-md transition ${
              viewMode === "list"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
            }`}
          >
            {t("stakeholders.planning.engagement.listView")}
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
          >
            <option value="all">{t("stakeholders.planning.engagement.allPlans")}</option>
            <option value="active">{t("stakeholders.planning.engagement.activePlans")}</option>
            <option value="scheduled">{t("stakeholders.planning.engagement.scheduledPlans")}</option>
            <option value="completed">{t("stakeholders.planning.engagement.completedPlans")}</option>
            <option value="overdue">{t("stakeholders.planning.engagement.overduePlans")}</option>
          </select>
          
          <button
            onClick={() => {
              setEditingPlan(null);
              setShowCreateModal(true);
            }}
            className="flex items-center px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("stakeholders.planning.engagement.createPlan")}
          </button>
        </div>
      </div>
      
      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: t("stakeholders.planning.engagement.totalPlans"),
            value: engagementPlans.length,
            icon: Calendar,
            color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
          },
          {
            label: t("stakeholders.planning.engagement.dueThisWeek"),
            value: engagementPlans.filter(p => {
              const due = new Date(p.nextActionDate);
              const today = new Date();
              const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
              return due >= today && due <= weekEnd && p.status !== "completed";
            }).length,
            icon: Clock,
            color: "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400"
          },
          {
            label: t("stakeholders.planning.engagement.overdue"),
            value: engagementPlans.filter(p => {
              const due = new Date(p.nextActionDate);
              return due < new Date() && p.status !== "completed";
            }).length,
            icon: AlertCircle,
            color: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
          },
          {
            label: t("stakeholders.planning.engagement.completed"),
            value: engagementPlans.filter(p => p.status === "completed").length,
            icon: CheckCircle,
            color: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
          }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`p-4 rounded-lg ${stat.color}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-75">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <Icon className="w-8 h-8 opacity-50" />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Content View */}
      {viewMode === "calendar" ? renderCalendarView() : renderListView()}
      
      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 backdrop-blur-xl bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-zinc-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingPlan ? t("stakeholders.planning.engagement.editPlan") : t("stakeholders.planning.engagement.createPlan")}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Stakeholder Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.engagement.stakeholder")}
                </label>
                <select
                  value={planForm.stakeholderId}
                  onChange={(e) => setPlanForm({ ...planForm, stakeholderId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  disabled={editingPlan}
                >
                  <option value="">{t("stakeholders.engagement.selectStakeholder")}</option>
                  {stakeholders.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} - {s.role}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Objective */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.engagement.objective")}
                </label>
                <input
                  type="text"
                  value={planForm.objective}
                  onChange={(e) => setPlanForm({ ...planForm, objective: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  placeholder={t("stakeholders.engagement.objectivePlaceholder")}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    {t("stakeholders.engagement.method")}
                  </label>
                  <select
                    value={planForm.method}
                    onChange={(e) => setPlanForm({ ...planForm, method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  >
                    {engagementMethods.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Frequency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    {t("stakeholders.engagement.frequency")}
                  </label>
                  <select
                    value={planForm.frequency}
                    onChange={(e) => setPlanForm({ ...planForm, frequency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  >
                    {frequencies.map(freq => (
                      <option key={freq.value} value={freq.value}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Next Action Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    {t("stakeholders.engagement.nextActionDate")}
                  </label>
                  <input
                    type="date"
                    value={planForm.nextActionDate}
                    onChange={(e) => setPlanForm({ ...planForm, nextActionDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
                
                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    {t("stakeholders.engagement.priority")}
                  </label>
                  <select
                    value={planForm.priority}
                    onChange={(e) => setPlanForm({ ...planForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  >
                    {priorities.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Owner */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.engagement.owner")}
                </label>
                <input
                  type="text"
                  value={planForm.owner}
                  onChange={(e) => setPlanForm({ ...planForm, owner: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  placeholder={t("stakeholders.engagement.ownerPlaceholder")}
                />
              </div>
              
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.engagement.description")}
                </label>
                <textarea
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  placeholder={t("stakeholders.engagement.descriptionPlaceholder")}
                />
              </div>
              
              {/* Expected Outcome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.engagement.expectedOutcome")}
                </label>
                <textarea
                  value={planForm.expectedOutcome}
                  onChange={(e) => setPlanForm({ ...planForm, expectedOutcome: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  placeholder={t("stakeholders.engagement.expectedOutcomePlaceholder")}
                />
              </div>
              
              {/* Reminder Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.engagement.reminderDays")}
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={planForm.reminderDays}
                  onChange={(e) => setPlanForm({ ...planForm, reminderDays: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
                  {t("stakeholders.engagement.reminderHint")}
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 dark:border-zinc-700 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition"
              >
                {t("stakeholders.cancel")}
              </button>
              <button
                onClick={handleCreateOrUpdate}
                disabled={!planForm.stakeholderId || !planForm.objective || !planForm.owner}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md transition"
              >
                {editingPlan ? t("stakeholders.planning.engagement.updatePlan") : t("stakeholders.planning.engagement.createPlan")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EngagementPlanning;