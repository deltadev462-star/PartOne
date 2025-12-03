import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  FileJson,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  Database,
  ArrowRight,
  Info,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileSearch,
  History
} from "lucide-react";
import * as XLSX from 'xlsx';

const ImportExportTool = ({
  stakeholders,
  onImport,
  onExport
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("import"); // import, export, history
  const [importData, setImportData] = useState([]);
  const [importFile, setImportFile] = useState(null);
  const [importErrors, setImportErrors] = useState([]);
  const [importWarnings, setImportWarnings] = useState([]);
  const [importProgress, setImportProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResults, setValidationResults] = useState(null);
  const [exportFormat, setExportFormat] = useState("csv");
  const [exportFields, setExportFields] = useState({
    name: true,
    email: true,
    phone: true,
    organization: true,
    department: true,
    role: true,
    location: true,
    category: true,
    influence: true,
    interest: true,
    power: true,
    impact: true,
    engagementApproach: true,
    communicationPlan: true,
    notes: true
  });
  const [importHistory, setImportHistory] = useState([]);
  const [mappingConfig, setMappingConfig] = useState({});
  const [showMappingModal, setShowMappingModal] = useState(false);

  // Sample template structure
  const templateColumns = [
    t('stakeholders.field.name'), t('stakeholders.field.email'), t('stakeholders.field.phone'),
    t('stakeholders.field.organization'), t('stakeholders.field.department'), t('stakeholders.field.role'),
    t('stakeholders.field.location'), t('stakeholders.field.category'), t('stakeholders.field.influence'),
    t('stakeholders.field.interest'), t('stakeholders.field.power'), t('stakeholders.field.impact'),
    t('stakeholders.field.engagementApproach'), t('stakeholders.field.communicationPlan'), t('stakeholders.field.notes')
  ];

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportFile(file);
    setImportErrors([]);
    setImportWarnings([]);
    setIsProcessing(true);

    try {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      let data = [];

      if (fileExtension === 'csv') {
        data = await parseCSV(file);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        data = await parseExcel(file);
      } else if (fileExtension === 'json') {
        data = await parseJSON(file);
      } else {
        throw new Error(t("stakeholders.import.unsupportedFormat"));
      }

      // Auto-detect column mapping
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        const mapping = autoDetectMapping(headers);
        setMappingConfig(mapping);
      }

      setImportData(data);
      validateImportData(data);
    } catch (error) {
      setImportErrors([{
        row: 0,
        message: error.message
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim());
          const data = [];

          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
              const values = lines[i].split(',').map(v => v.trim());
              const row = {};
              headers.forEach((header, index) => {
                row[header] = values[index] || '';
              });
              data.push(row);
            }
          }

          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  };

  const parseExcel = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const parseJSON = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          resolve(Array.isArray(data) ? data : [data]);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  };

  const autoDetectMapping = (headers) => {
    const mapping = {};
    const lowerHeaders = headers.map(h => h.toLowerCase());

    // Map common variations
    const fieldMappings = {
      name: ['name', 'stakeholder', 'stakeholder name', 'full name'],
      email: ['email', 'e-mail', 'email address', 'mail'],
      phone: ['phone', 'telephone', 'tel', 'mobile', 'contact'],
      organization: ['organization', 'company', 'org', 'organisation'],
      department: ['department', 'dept', 'division', 'team'],
      role: ['role', 'title', 'position', 'job title'],
      location: ['location', 'address', 'city', 'office'],
      category: ['category', 'type', 'classification'],
      influence: ['influence', 'influence level', 'power'],
      interest: ['interest', 'interest level', 'engagement'],
      power: ['power', 'authority', 'decision power'],
      impact: ['impact', 'impact level', 'significance']
    };

    Object.entries(fieldMappings).forEach(([field, variations]) => {
      const matchIndex = lowerHeaders.findIndex(h => 
        variations.some(v => h.includes(v))
      );
      if (matchIndex >= 0) {
        mapping[field] = headers[matchIndex];
      }
    });

    return mapping;
  };

  const validateImportData = (data) => {
    const errors = [];
    const warnings = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10,11}$/;
    const validLevels = ['high', 'medium', 'low'];
    const validCategories = ['internal', 'external', 'customer', 'supplier', 'regulatory'];

    data.forEach((row, index) => {
      const rowNumber = index + 2; // Account for header row

      // Required fields
      if (!row.name && !row.Name) {
        errors.push({
          row: rowNumber,
          field: 'name',
          message: t("stakeholders.import.validation.nameRequired")
        });
      }

      // Email validation
      const email = row.email || row.Email;
      if (email && !emailRegex.test(email)) {
        warnings.push({
          row: rowNumber,
          field: 'email',
          message: t("stakeholders.import.validation.invalidEmail", { email })
        });
      }

      // Phone validation
      const phone = row.phone || row.Phone;
      if (phone && !phoneRegex.test(phone.replace(/\D/g, ''))) {
        warnings.push({
          row: rowNumber,
          field: 'phone',
          message: t("stakeholders.import.validation.invalidPhone", { phone })
        });
      }

      // Level validation
      const influence = (row.influence || row.Influence || '').toLowerCase();
      if (influence && !validLevels.includes(influence)) {
        warnings.push({
          row: rowNumber,
          field: 'influence',
          message: t("stakeholders.import.validation.invalidInfluence", { value: influence })
        });
      }

      const interest = (row.interest || row.Interest || '').toLowerCase();
      if (interest && !validLevels.includes(interest)) {
        warnings.push({
          row: rowNumber,
          field: 'interest',
          message: t("stakeholders.import.validation.invalidInterest", { value: interest })
        });
      }

      // Check for duplicates
      const isDuplicate = stakeholders.some(s => 
        s.name?.toLowerCase() === (row.name || row.Name || '').toLowerCase() &&
        s.email?.toLowerCase() === (email || '').toLowerCase()
      );
      
      if (isDuplicate) {
        warnings.push({
          row: rowNumber,
          field: 'duplicate',
          message: t("stakeholders.import.validation.duplicate", { name: row.name || row.Name })
        });
      }
    });

    setImportErrors(errors);
    setImportWarnings(warnings);
    
    setValidationResults({
      totalRows: data.length,
      validRows: data.length - errors.length,
      errors: errors.length,
      warnings: warnings.length
    });

    return errors.length === 0;
  };

  const handleImport = async () => {
    if (importErrors.length > 0) {
      alert(t("stakeholders.import.fixErrors"));
      return;
    }

    setIsProcessing(true);
    setImportProgress(0);

    try {
      // Transform data based on mapping
      const transformedData = importData.map((row, index) => {
        const transformed = {
          workspaceId: null, // Will be set by backend
          projectId: null, // Will be set by backend
        };

        Object.entries(mappingConfig).forEach(([field, sourceColumn]) => {
          if (sourceColumn && row[sourceColumn]) {
            transformed[field] = row[sourceColumn];
          }
        });

        // Normalize levels
        if (transformed.influence) {
          transformed.influence = transformed.influence.toLowerCase();
        }
        if (transformed.interest) {
          transformed.interest = transformed.interest.toLowerCase();
        }
        if (transformed.power) {
          transformed.power = transformed.power.toLowerCase();
        }
        if (transformed.impact) {
          transformed.impact = transformed.impact.toLowerCase();
        }

        setImportProgress(Math.round((index + 1) / importData.length * 100));
        return transformed;
      });

      await onImport(transformedData);
      
      // Add to import history
      const historyEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        fileName: importFile.name,
        records: transformedData.length,
        status: 'success',
        warnings: importWarnings.length
      };
      setImportHistory([historyEntry, ...importHistory]);
      
      // Reset import state
      setImportData([]);
      setImportFile(null);
      setImportErrors([]);
      setImportWarnings([]);
      setValidationResults(null);
      setImportProgress(0);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Import error:", error);
      setImportErrors([{
        row: 0,
        message: t("stakeholders.import.error", { error: error.message })
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const template = [templateColumns];
    const csvContent = template.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stakeholders_template.csv";
    a.click();
  };

  const handleExport = () => {
    const selectedFields = Object.entries(exportFields)
      .filter(([_, selected]) => selected)
      .map(([field]) => field);

    if (selectedFields.length === 0) {
      alert(t("stakeholders.export.selectFields"));
      return;
    }

    if (exportFormat === 'csv') {
      exportToCSV(selectedFields);
    } else if (exportFormat === 'excel') {
      exportToExcel(selectedFields);
    } else if (exportFormat === 'json') {
      exportToJSON(selectedFields);
    }
  };

  const exportToCSV = (fields) => {
    const headers = fields.map(field => 
      field.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase())
    );
    
    const rows = stakeholders.map(stakeholder => 
      fields.map(field => stakeholder[field] || '').join(',')
    );
    
    const csvContent = [
      headers.join(','),
      ...rows
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stakeholders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportToExcel = (fields) => {
    const headers = fields.map(field => 
      field.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase())
    );
    
    const data = stakeholders.map(stakeholder => {
      const row = {};
      fields.forEach((field, index) => {
        row[headers[index]] = stakeholder[field] || '';
      });
      return row;
    });
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stakeholders");
    XLSX.writeFile(wb, `stakeholders_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToJSON = (fields) => {
    const data = stakeholders.map(stakeholder => {
      const obj = {};
      fields.forEach(field => {
        if (stakeholder[field]) {
          obj[field] = stakeholder[field];
        }
      });
      return obj;
    });
    
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stakeholders_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const renderImportTab = () => (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t("stakeholders.import.title")}
        </h3>
        
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            {!importFile ? (
              <>
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-zinc-400 mb-4">
                  {t("stakeholders.import.dragDrop")}
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition"
                >
                  {t("stakeholders.import.selectFile")}
                </button>
                <p className="text-xs text-gray-500 dark:text-zinc-500 mt-2">
                  {t("stakeholders.import.supportedFormats")}
                </p>
              </>
            ) : (
              <div className="space-y-4">
                <FileSpreadsheet className="w-12 h-12 mx-auto text-green-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {importFile.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-zinc-500">
                    {(importFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                
                {isProcessing && (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">{t("stakeholders.import.processing")}</span>
                  </div>
                )}
                
                {importProgress > 0 && importProgress < 100 && (
                  <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                )}
                
                <button
                  onClick={() => {
                    setImportFile(null);
                    setImportData([]);
                    setImportErrors([]);
                    setImportWarnings([]);
                    setValidationResults(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  {t("stakeholders.import.clearFile")}
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600"
            >
              <Download className="w-4 h-4" />
              {t("stakeholders.import.downloadTemplate")}
            </button>
            
            {importData.length > 0 && (
              <button
                onClick={() => setShowMappingModal(true)}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-300"
              >
                <Database className="w-4 h-4" />
                {t("stakeholders.import.configureMapping")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Validation Results */}
      {validationResults && (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t("stakeholders.import.validationResults")}
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{validationResults.totalRows}</p>
              <p className="text-sm text-gray-500 dark:text-zinc-500">
                {t("stakeholders.import.totalRows")}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{validationResults.validRows}</p>
              <p className="text-sm text-gray-500 dark:text-zinc-500">
                {t("stakeholders.import.validRows")}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{validationResults.errors}</p>
              <p className="text-sm text-gray-500 dark:text-zinc-500">
                {t("stakeholders.import.errors")}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{validationResults.warnings}</p>
              <p className="text-sm text-gray-500 dark:text-zinc-500">
                {t("stakeholders.import.warnings")}
              </p>
            </div>
          </div>
          
          {/* Errors */}
          {importErrors.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                {t("stakeholders.import.errors")}
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {importErrors.map((error, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm">
                    <span className="font-medium">{t("stakeholders.importExport.row")} {error.row}:</span>
                    <span className="text-red-600 dark:text-red-400">{error.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Warnings */}
          {importWarnings.length > 0 && (
            <div>
              <h4 className="font-medium text-yellow-600 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {t("stakeholders.import.warnings")}
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {importWarnings.map((warning, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm">
                    <span className="font-medium">{t("stakeholders.importExport.row")} {warning.row}:</span>
                    <span className="text-yellow-600 dark:text-yellow-400">{warning.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => {
                setImportData([]);
                setImportFile(null);
                setImportErrors([]);
                setImportWarnings([]);
                setValidationResults(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="px-4 py-2 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition"
            >
              {t("stakeholders.cancel")}
            </button>
            <button
              onClick={handleImport}
              disabled={importErrors.length > 0 || isProcessing}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md transition flex items-center gap-2"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {t("stakeholders.import.importButton", { count: validationResults.validRows })}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderExportTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t("stakeholders.export.title")}
        </h3>
        
        <div className="space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">
              {t("stakeholders.export.format")}
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'csv', icon: FileText, label: 'CSV' },
                { value: 'excel', icon: FileSpreadsheet, label: 'Excel' },
                { value: 'json', icon: FileJson, label: 'JSON' }
              ].map(format => (
                <button
                  key={format.value}
                  onClick={() => setExportFormat(format.value)}
                  className={`p-4 border rounded-lg transition ${
                    exportFormat === format.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-600'
                  }`}
                >
                  <format.icon className={`w-8 h-8 mx-auto mb-2 ${
                    exportFormat === format.value
                      ? 'text-blue-500'
                      : 'text-gray-400'
                  }`} />
                  <p className={`text-sm font-medium ${
                    exportFormat === format.value
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-zinc-300'
                  }`}>
                    {format.label}
                  </p>
                </button>
              ))}
            </div>
          </div>
          
          {/* Field Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                {t("stakeholders.export.selectFields")}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setExportFields(Object.fromEntries(
                    Object.keys(exportFields).map(key => [key, true])
                  ))}
                  className="text-xs text-blue-500 hover:text-blue-600"
                >
                  {t("stakeholders.export.selectAll")}
                </button>
                <span className="text-gray-400">|</span>
                <button
                  onClick={() => setExportFields(Object.fromEntries(
                    Object.keys(exportFields).map(key => [key, false])
                  ))}
                  className="text-xs text-gray-500 hover:text-gray-600"
                >
                  {t("stakeholders.export.deselectAll")}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(exportFields).map(([field, selected]) => {
                // Map field names to translation keys
                const fieldTranslationKey = {
                  name: 'stakeholders.field.name',
                  email: 'stakeholders.field.email',
                  phone: 'stakeholders.field.phone',
                  organization: 'stakeholders.field.organization',
                  department: 'stakeholders.field.department',
                  role: 'stakeholders.field.role',
                  location: 'stakeholders.field.location',
                  category: 'stakeholders.field.category',
                  influence: 'stakeholders.field.influence',
                  interest: 'stakeholders.field.interest',
                  power: 'stakeholders.field.power',
                  impact: 'stakeholders.field.impact',
                  engagementApproach: 'stakeholders.field.engagementApproach',
                  communicationPlan: 'stakeholders.field.communicationPlan',
                  notes: 'stakeholders.field.notes'
                };
                
                return (
                  <label
                    key={field}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(e) => setExportFields({
                        ...exportFields,
                        [field]: e.target.checked
                      })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-zinc-300">
                      {t(fieldTranslationKey[field] || field)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
          
          {/* Export Summary */}
          <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-zinc-400">
              {t("stakeholders.export.summary", {
                count: stakeholders.length,
                fields: Object.values(exportFields).filter(Boolean).length,
                format: exportFormat.toUpperCase()
              })}
            </p>
          </div>
          
          <button
            onClick={handleExport}
            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t("stakeholders.export.exportButton")}
          </button>
        </div>
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg">
      <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t("stakeholders.import.history")}
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-zinc-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                {t("stakeholders.import.timestamp")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                {t("stakeholders.import.fileName")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                {t("stakeholders.import.records")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                {t("stakeholders.import.status")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                {t("stakeholders.import.warnings")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
            {importHistory.length > 0 ? (
              importHistory.map(entry => (
                <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600 dark:text-zinc-400">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {entry.fileName}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {entry.records}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {entry.status === 'success' ? (
                      <span className="px-2 py-1 text-xs rounded-full font-medium text-green-600 bg-green-50 flex items-center gap-1 w-fit">
                        <CheckCircle className="w-3 h-3" />
                        {t("stakeholders.import.success")}
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full font-medium text-red-600 bg-red-50 flex items-center gap-1 w-fit">
                        <XCircle className="w-3 h-3" />
                        {t("stakeholders.import.failed")}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {entry.warnings > 0 && (
                      <span className="px-2 py-1 text-xs rounded-full font-medium text-yellow-600 bg-yellow-50">
                        {entry.warnings}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center">
                  <History className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 dark:text-zinc-500">
                    {t("stakeholders.import.noHistory")}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-zinc-800">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab("import")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === "import"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            {t("stakeholders.import.tab")}
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === "export"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
            }`}
          >
            <Download className="w-4 h-4 inline mr-2" />
            {t("stakeholders.export.tab")}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeTab === "history"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
            }`}
          >
            <History className="w-4 h-4 inline mr-2" />
            {t("stakeholders.import.historyTab")}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "import" && renderImportTab()}
      {activeTab === "export" && renderExportTab()}
      {activeTab === "history" && renderHistoryTab()}
    </div>
  );
};

export default ImportExportTool;