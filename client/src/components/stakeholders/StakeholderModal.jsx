import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Upload, X, FileText } from "lucide-react";

const StakeholderModal = ({
  isOpen,
  onClose,
  stakeholder = null,
  projects,
  createStakeholder,
  updateStakeholder,
  getEngagementStrategy
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  
  const initialFormData = {
    projectId: stakeholder?.projectId || projects[0]?.id || "",
    name: stakeholder?.name || "",
    email: stakeholder?.email || "",
    role: stakeholder?.role || "",
    organization: stakeholder?.organization || "",
    department: stakeholder?.department || "",
    phone: stakeholder?.phone || "",
    location: stakeholder?.location || "",
    influence: stakeholder?.influence || "medium",
    interest: stakeholder?.interest || "medium",
    power: stakeholder?.power || "medium",
    impact: stakeholder?.impact || "medium",
    category: stakeholder?.category || "external",
    engagementApproach: stakeholder?.engagementApproach || "",
    communicationPlan: stakeholder?.communicationPlan || "",
    communicationChannel: stakeholder?.communicationChannel || "",
    engagementFrequency: stakeholder?.engagementFrequency || "",
    engagementNotes: stakeholder?.engagementNotes || "",
    notes: stakeholder?.notes || "",
    tags: stakeholder?.tags || [],
    attachments: stakeholder?.attachments || [],
  };
  
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState(stakeholder?.attachments || []);

  // Reset form when modal opens/closes or when stakeholder changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        projectId: stakeholder?.projectId || projects[0]?.id || "",
        name: stakeholder?.name || "",
        email: stakeholder?.email || "",
        role: stakeholder?.role || "",
        organization: stakeholder?.organization || "",
        department: stakeholder?.department || "",
        phone: stakeholder?.phone || "",
        location: stakeholder?.location || "",
        influence: stakeholder?.influence || "medium",
        interest: stakeholder?.interest || "medium",
        power: stakeholder?.power || "medium",
        impact: stakeholder?.impact || "medium",
        category: stakeholder?.category || "external",
        engagementApproach: stakeholder?.engagementApproach || "",
        communicationPlan: stakeholder?.communicationPlan || "",
        communicationChannel: stakeholder?.communicationChannel || "",
        engagementFrequency: stakeholder?.engagementFrequency || "",
        engagementNotes: stakeholder?.engagementNotes || "",
        notes: stakeholder?.notes || "",
        tags: stakeholder?.tags || [],
        attachments: stakeholder?.attachments || [],
      });
      setUploadedFiles(stakeholder?.attachments || []);
      setErrors({});
    }
  }, [isOpen, stakeholder, projects]);

  if (!isOpen) return null;

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9]{11}$/;
    return phoneRegex.test(phone);
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.name.trim()) {
      newErrors.name = t("stakeholders.errors.nameRequired");
    }

    if (!formData.role.trim()) {
      newErrors.role = t("stakeholders.errors.roleRequired");
    }

    // Email validation
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = t("stakeholders.errors.invalidEmail");
    }

    // Phone validation
    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = t("stakeholders.errors.invalidPhone");
    }

    // Project selection for new stakeholders
    if (!stakeholder && !formData.projectId) {
      newErrors.projectId = t("stakeholders.errors.projectRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length <= 11) {
      setFormData({ ...formData, phone: value });
      if (errors.phone) {
        setErrors({ ...errors, phone: '' });
      }
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      file: file
    }));
    setUploadedFiles([...uploadedFiles, ...newFiles]);
  };

  const removeFile = (fileId) => {
    setUploadedFiles(uploadedFiles.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      attachments: uploadedFiles
    };

    if (stakeholder) {
      updateStakeholder(stakeholder.id, submitData);
    } else {
      createStakeholder(submitData);
    }
    onClose();
  };

  const strategy = getEngagementStrategy(formData.influence, formData.interest);

  return (
    <div className="fixed inset-0 backdrop-blur-xl bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 dark:border-zinc-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {stakeholder ? t("stakeholders.editStakeholder") : t("stakeholders.addNewStakeholder")}
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">
              {t("stakeholders.basicInformation")}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.nameRequired")}
                </label>
                <input
                  type="text"
                  placeholder={t("stakeholders.placeholders.name")}
                  className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-zinc-700'} rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white`}
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.emailLabel")}
                </label>
                <input
                  type="email"
                  placeholder={t("stakeholders.placeholders.email")}
                  className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-zinc-700'} rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white`}
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.roleRequired")}
                </label>
                <input
                  type="text"
                  placeholder={t("stakeholders.placeholders.role")}
                  className={`w-full px-3 py-2 border ${errors.role ? 'border-red-500' : 'border-gray-300 dark:border-zinc-700'} rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white`}
                  value={formData.role}
                  onChange={(e) => handleFieldChange('role', e.target.value)}
                />
                {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.organization")}
                </label>
                <input
                  type="text"
                  placeholder={t("stakeholders.placeholders.organization")}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  value={formData.organization}
                  onChange={(e) => handleFieldChange('organization', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.department")}
                </label>
                <input
                  type="text"
                  placeholder={t("stakeholders.placeholders.department")}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  value={formData.department}
                  onChange={(e) => handleFieldChange('department', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.phone")}
                </label>
                <input
                  type="tel"
                  placeholder={t("stakeholders.placeholders.phone")}
                  className={`w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-zinc-700'} rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white`}
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  maxLength="11"
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.location")}
                </label>
                <input
                  type="text"
                  placeholder={t("stakeholders.placeholders.location")}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  value={formData.location}
                  onChange={(e) => handleFieldChange('location', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.category")}
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  value={formData.category}
                  onChange={(e) => handleFieldChange('category', e.target.value)}
                >
                  <option value="internal">{t("stakeholders.categories.internal")}</option>
                  <option value="external">{t("stakeholders.categories.external")}</option>
                  <option value="customer">{t("stakeholders.categories.customer")}</option>
                  <option value="supplier">{t("stakeholders.categories.supplier")}</option>
                  <option value="regulatory">{t("stakeholders.categories.regulatory")}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Influence/Interest Matrix */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">
              {t("stakeholders.influenceInterestMatrix")}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.influenceLevel")}
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  value={formData.influence}
                  onChange={(e) => handleFieldChange('influence', e.target.value)}
                >
                  <option value="high">{t("stakeholders.high")}</option>
                  <option value="medium">{t("stakeholders.medium")}</option>
                  <option value="low">{t("stakeholders.low")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.interestLevel")}
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  value={formData.interest}
                  onChange={(e) => handleFieldChange('interest', e.target.value)}
                >
                  <option value="high">{t("stakeholders.high")}</option>
                  <option value="medium">{t("stakeholders.medium")}</option>
                  <option value="low">{t("stakeholders.low")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.powerLevel")}
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  value={formData.power}
                  onChange={(e) => handleFieldChange('power', e.target.value)}
                >
                  <option value="high">{t("stakeholders.high")}</option>
                  <option value="medium">{t("stakeholders.medium")}</option>
                  <option value="low">{t("stakeholders.low")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.impactLevel")}
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  value={formData.impact}
                  onChange={(e) => handleFieldChange('impact', e.target.value)}
                >
                  <option value="high">{t("stakeholders.high")}</option>
                  <option value="medium">{t("stakeholders.medium")}</option>
                  <option value="low">{t("stakeholders.low")}</option>
                </select>
              </div>
            </div>

            {/* Recommended Strategy Display */}
            <div className={`mt-3 p-3 rounded-md ${strategy.color}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">{t("stakeholders.recommendedStrategy")}: {strategy.strategy}</span>
              </div>
              <p className="text-sm mt-1">{strategy.description}</p>
            </div>
          </div>

          {/* Engagement Strategy */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">
              {t("stakeholders.engagementStrategy")}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.engagementApproach")}
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  value={formData.engagementApproach}
                  onChange={(e) => handleFieldChange('engagementApproach', e.target.value)}
                >
                  <option value="">{t("stakeholders.selectApproach")}</option>
                  <option value="manage-closely">{t("stakeholders.strategies.manageClosely")}</option>
                  <option value="keep-satisfied">{t("stakeholders.strategies.keepSatisfied")}</option>
                  <option value="keep-informed">{t("stakeholders.strategies.keepInformed")}</option>
                  <option value="monitor">{t("stakeholders.strategies.monitor")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.communicationPlan")}
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  value={formData.communicationPlan}
                  onChange={(e) => handleFieldChange('communicationPlan', e.target.value)}
                >
                  <option value="">{t("stakeholders.selectFrequency")}</option>
                  <option value="daily">{t("stakeholders.frequencies.daily")}</option>
                  <option value="weekly">{t("stakeholders.frequencies.weekly")}</option>
                  <option value="bi-weekly">{t("stakeholders.frequencies.biWeekly")}</option>
                  <option value="monthly">{t("stakeholders.frequencies.monthly")}</option>
                  <option value="quarterly">{t("stakeholders.frequencies.quarterly")}</option>
                  <option value="as-needed">{t("stakeholders.frequencies.asNeeded")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.communicationChannel")}
                </label>
                <input
                  type="text"
                  placeholder={t("stakeholders.placeholders.communicationChannel")}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  value={formData.communicationChannel}
                  onChange={(e) => handleFieldChange('communicationChannel', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.engagementFrequency")}
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  value={formData.engagementFrequency}
                  onChange={(e) => handleFieldChange('engagementFrequency', e.target.value)}
                >
                  <option value="">{t("stakeholders.selectFrequency")}</option>
                  <option value="high">{t("stakeholders.frequencies.high")}</option>
                  <option value="medium">{t("stakeholders.frequencies.medium")}</option>
                  <option value="low">{t("stakeholders.frequencies.low")}</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                {t("stakeholders.engagementNotes")}
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                rows="3"
                placeholder={t("stakeholders.placeholders.engagementNotes")}
                value={formData.engagementNotes}
                onChange={(e) => handleFieldChange('engagementNotes', e.target.value)}
              />
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              {t("stakeholders.generalNotes")}
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
              rows="3"
              placeholder={t("stakeholders.placeholders.generalNotes")}
              value={formData.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
            />
          </div>

          {/* Attachments Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
              {t("stakeholders.attachments")}
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-lg p-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition"
              >
                <Upload className="size-4" />
                {t("stakeholders.uploadFile")}
              </button>
              <p className="text-xs text-gray-500 dark:text-zinc-400 text-center mt-2">
                {t("stakeholders.placeholders.uploadHint")}
              </p>
              
              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-zinc-800 rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                            {file.fileName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-zinc-400">
                            {formatFileSize(file.fileSize)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded transition"
                      >
                        <X className="size-4 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Project Selection */}
          {!stakeholder && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                {t("stakeholders.linkToProject")}
              </label>
              <select
                className={`w-full px-3 py-2 border ${errors.projectId ? 'border-red-500' : 'border-gray-300 dark:border-zinc-700'} rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white`}
                value={formData.projectId}
                onChange={(e) => handleFieldChange('projectId', e.target.value)}
              >
                <option value="">{t("stakeholders.placeholders.selectProject")}</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {errors.projectId && <p className="text-red-500 text-xs mt-1">{errors.projectId}</p>}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-zinc-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition"
          >
            {t("stakeholders.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition"
          >
            {stakeholder ? t("stakeholders.saveChanges") : t("stakeholders.addStakeholder")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StakeholderModal;