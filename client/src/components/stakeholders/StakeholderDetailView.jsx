import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  X,
  Edit2,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  ChevronRight,
  Upload,
  Download,
  FileText,
  Paperclip,
  History,
  MessageSquare,
  AlertCircle,
  Activity
} from "lucide-react";

const StakeholderDetailView = ({
  showDetailView,
  selectedStakeholder,
  setShowDetailView,
  setShowCreateModal,
  activeTab,
  setActiveTab,
  getEngagementStrategy,
  getInfluenceColor,
  getInterestColor,
  addHistoryEntry,
  openStakeholderDetail,
  updateStakeholder
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const [uploadedFiles, setUploadedFiles] = useState(selectedStakeholder?.attachments || []);
  const [showHistoryForm, setShowHistoryForm] = useState(false);
  const [historyFormData, setHistoryFormData] = useState({
    type: 'meeting',
    title: '',
    description: ''
  });

  const getActivityIcon = (type) => {
    switch (type) {
      case "meeting":
        return <Calendar className="size-4" />;
      case "email":
        return <Mail className="size-4" />;
      case "call":
        return <Phone className="size-4" />;
      case "concern":
        return <AlertCircle className="size-4" />;
      case "update":
        return <Activity className="size-4" />;
      default:
        return <MessageSquare className="size-4" />;
    }
  };

  if (!showDetailView || !selectedStakeholder) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-xl bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-300 dark:border-zinc-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-medium">
                {selectedStakeholder.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedStakeholder.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-zinc-400">
                  {selectedStakeholder.role}
                  {selectedStakeholder.organization && ` ${t("stakeholders.at")} ${selectedStakeholder.organization}`}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 text-xs rounded-md ${getInfluenceColor(selectedStakeholder.influence)}`}>
                    {t("stakeholders.influence")}: {t(`stakeholders.${selectedStakeholder.influence}`)}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded-md ${getInterestColor(selectedStakeholder.interest)}`}>
                    {t("stakeholders.interest")}: {t(`stakeholders.${selectedStakeholder.interest}`)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setShowDetailView(false);
                  setShowCreateModal(true);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition"
              >
                <Edit2 className="size-4" />
              </button>
              <button
                onClick={() => setShowDetailView(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-300 dark:border-zinc-700">
          <div className="flex gap-8 px-6">
            {["profile", "engagement", "history", "meetings", "attachments"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-1 border-b-2 transition capitalize ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-500"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-zinc-400"
                }`}
              >
                {t(`stakeholders.tabs.${tab}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-3">
                    {t("stakeholders.contactInformation")}
                  </h3>
                  <div className="space-y-2">
                    {selectedStakeholder.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="size-4 text-gray-400" />
                        <a href={`mailto:${selectedStakeholder.email}`} className="text-sm text-blue-500 hover:underline">
                          {selectedStakeholder.email}
                        </a>
                      </div>
                    )}
                    {selectedStakeholder.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="size-4 text-gray-400" />
                        <span className="text-sm">{selectedStakeholder.phone}</span>
                      </div>
                    )}
                    {selectedStakeholder.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="size-4 text-gray-400" />
                        <span className="text-sm">{selectedStakeholder.location}</span>
                      </div>
                    )}
                    {selectedStakeholder.department && (
                      <div className="flex items-center gap-2">
                        <Building2 className="size-4 text-gray-400" />
                        <span className="text-sm">{selectedStakeholder.department}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-3">
                    {t("stakeholders.analysisMatrix")}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-zinc-300">{t("stakeholders.power")}:</span>
                      <span className={`px-2 py-0.5 text-xs rounded-md capitalize ${
                        selectedStakeholder.power === "high" ? "bg-red-100 text-red-600" : 
                        selectedStakeholder.power === "medium" ? "bg-yellow-100 text-yellow-600" : 
                        "bg-green-100 text-green-600"
                      }`}>
                        {t(`stakeholders.${selectedStakeholder.power || "medium"}`)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-zinc-300">{t("stakeholders.impact")}:</span>
                      <span className={`px-2 py-0.5 text-xs rounded-md capitalize ${
                        selectedStakeholder.impact === "high" ? "bg-red-100 text-red-600" : 
                        selectedStakeholder.impact === "medium" ? "bg-yellow-100 text-yellow-600" : 
                        "bg-green-100 text-green-600"
                      }`}>
                        {t(`stakeholders.${selectedStakeholder.impact || "medium"}`)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-zinc-300">{t("stakeholders.category")}:</span>
                      <span className="px-2 py-0.5 text-xs rounded-md bg-gray-100 dark:bg-zinc-800 capitalize">
                        {t(`stakeholders.categories.${selectedStakeholder.category || "external"}`)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedStakeholder.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-2">
                    {t("stakeholders.notes")}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-zinc-300">
                    {selectedStakeholder.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "engagement" && (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-4">
                {(() => {
                  const strategy = getEngagementStrategy(
                    selectedStakeholder.influence, 
                    selectedStakeholder.interest
                  );
                  return (
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                        {t("stakeholders.recommendedStrategy")}
                      </h3>
                      <div className={`inline-block px-3 py-1 rounded-md ${strategy.color} mb-2`}>
                        {strategy.strategy}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-zinc-400">
                        {strategy.description}
                      </p>
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-3">
                    {t("stakeholders.communicationPlan")}
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-zinc-300">{t("stakeholders.engagementFrequency")}:</span>
                      <p className="font-medium">
                        {selectedStakeholder.communicationPlan ? t(`stakeholders.frequencies.${selectedStakeholder.communicationPlan}`) : t("stakeholders.notDefined")}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-zinc-300">{t("stakeholders.communicationChannel")}:</span>
                      <p className="font-medium">
                        {selectedStakeholder.communicationChannel || t("stakeholders.notDefined")}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-zinc-300">{t("stakeholders.engagementLevels")}:</span>
                      <p className="font-medium capitalize">
                        {selectedStakeholder.engagementFrequency ? t(`stakeholders.frequencies.${selectedStakeholder.engagementFrequency}`) : t("stakeholders.notDefined")}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-3">
                    {t("stakeholders.engagementApproach")}
                  </h3>
                  <div className="space-y-2">
                    <p className="font-medium capitalize">
                      {selectedStakeholder.engagementApproach ? t(`stakeholders.strategies.${selectedStakeholder.engagementApproach.replace('-', '')}`) : t("stakeholders.notDefined")}
                    </p>
                    {selectedStakeholder.engagementNotes && (
                      <p className="text-sm text-gray-600 dark:text-zinc-400">
                        {selectedStakeholder.engagementNotes}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-300 dark:border-zinc-700 pt-4">
                <button 
                  onClick={() => {
                    setShowDetailView(false);
                    setShowCreateModal(true);
                  }}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition"
                >
                  {t("stakeholders.updateEngagementStrategy")}
                </button>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400">
                  {t("stakeholders.stakeholderHistory")}
                </h3>
                <button
                  onClick={() => setShowHistoryForm(true)}
                  className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md transition"
                >
                  {t("stakeholders.addEntry")}
                </button>
              </div>

              {/* History Entry Form Popup */}
              {showHistoryForm && (
                <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
                  <div className="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg p-6 max-w-md w-full mx-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t("stakeholders.addEntry")}
                      </h3>
                      <button
                        onClick={() => {
                          setShowHistoryForm(false);
                          setHistoryFormData({ type: 'meeting', title: '', description: '' });
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                          {t("stakeholders.entryType")}
                        </label>
                        <select
                          value={historyFormData.type}
                          onChange={(e) => setHistoryFormData({...historyFormData, type: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="meeting">{t("stakeholders.meeting")}</option>
                          <option value="email">{t("stakeholders.email")}</option>
                          <option value="call">{t("stakeholders.call")}</option>
                          <option value="concern">{t("stakeholders.concern")}</option>
                          <option value="update">{t("stakeholders.update")}</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                          {t("stakeholders.title")}
                        </label>
                        <input
                          type="text"
                          value={historyFormData.title}
                          onChange={(e) => setHistoryFormData({...historyFormData, title: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={t("stakeholders.enterTitle")}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                          {t("stakeholders.description")}
                        </label>
                        <textarea
                          value={historyFormData.description}
                          onChange={(e) => setHistoryFormData({...historyFormData, description: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows="3"
                          placeholder={t("stakeholders.enterDescription")}
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => {
                          setShowHistoryForm(false);
                          setHistoryFormData({ type: 'meeting', title: '', description: '' });
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-md transition"
                      >
                        {t("common.cancel")}
                      </button>
                      <button
                        onClick={() => {
                          if (historyFormData.title.trim()) {
                            addHistoryEntry(selectedStakeholder.id, {
                              type: historyFormData.type,
                              title: historyFormData.title.trim(),
                              description: historyFormData.description.trim(),
                              status: "completed"
                            });
                            setShowHistoryForm(false);
                            setHistoryFormData({ type: 'meeting', title: '', description: '' });
                          }
                        }}
                        disabled={!historyFormData.title.trim()}
                        className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t("common.save")}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-3">
                {(selectedStakeholder.history && selectedStakeholder.history.length > 0) ? (
                  selectedStakeholder.history.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition"
                    >
                      <div className="p-2 rounded-full bg-gray-100 dark:bg-zinc-800">
                        {getActivityIcon(entry.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {entry.title}
                        </p>
                        {entry.description && (
                          <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
                            {entry.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 dark:text-zinc-400">
                            {new Date(entry.date).toLocaleDateString()}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded ${
                            entry.status === "completed"
                              ? "bg-green-100 text-green-600"
                              : entry.status === "scheduled"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {entry.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <History className="size-12 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-zinc-400">
                      {t("stakeholders.noHistoryEntries")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "meetings" && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-4">
                {t("stakeholders.relatedMeetings")}
              </h3>
              {(selectedStakeholder.meetings && selectedStakeholder.meetings.length > 0) ? (
                selectedStakeholder.meetings.map((meetingRelation) => (
                  <div
                    key={meetingRelation.meeting.id}
                    className="p-4 border dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {meetingRelation.meeting.title}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                          {new Date(meetingRelation.meeting.meetingDate).toLocaleDateString()}
                        </p>
                      </div>
                      <ChevronRight className="size-4 text-gray-400" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="size-12 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    {t("stakeholders.noMeetings")}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "attachments" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400">
                  {t("stakeholders.attachments")}
                </h3>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md transition"
                >
                  <Upload className="size-4" />
                  {t("stakeholders.uploadFile")}
                </button>
              </div>
              
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  const newFiles = files.map(file => ({
                    id: Date.now() + Math.random(),
                    fileName: file.name,
                    fileSize: file.size,
                    uploadedAt: new Date().toISOString(),
                    file: file
                  }));
                  const updatedFiles = [...uploadedFiles, ...newFiles];
                  setUploadedFiles(updatedFiles);
                  
                  // Update stakeholder with new attachments
                  if (updateStakeholder && selectedStakeholder) {
                    updateStakeholder(selectedStakeholder.id, {
                      ...selectedStakeholder,
                      attachments: updatedFiles
                    });
                  }
                  
                  // Reset input
                  e.target.value = '';
                }}
                multiple
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              />
              
              {(uploadedFiles && uploadedFiles.length > 0) ? (
                <div className="space-y-2">
                  {uploadedFiles.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 border dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="size-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {attachment.fileName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-zinc-400">
                            {t("stakeholders.uploaded")} {new Date(attachment.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            // Create download link
                            if (attachment.file) {
                              const url = URL.createObjectURL(attachment.file);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = attachment.fileName;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            }
                          }}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded transition"
                        >
                          <Download className="size-4" />
                        </button>
                        <button
                          onClick={() => {
                            const updatedFiles = uploadedFiles.filter(f => f.id !== attachment.id);
                            setUploadedFiles(updatedFiles);
                            
                            // Update stakeholder
                            if (updateStakeholder && selectedStakeholder) {
                              updateStakeholder(selectedStakeholder.id, {
                                ...selectedStakeholder,
                                attachments: updatedFiles
                              });
                            }
                          }}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded transition"
                        >
                          <X className="size-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Paperclip className="size-12 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    {t("stakeholders.noAttachments")}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StakeholderDetailView;