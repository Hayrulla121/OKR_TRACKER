export type Language = 'en' | 'ru' | 'uz';

export interface Translations {
  // App Header
  appTitle: string;
  organizationOverview: string;
  departmentDetails: string;

  // Sidebar
  controlPanel: string;
  departments: string;
  noDepartments: string;
  settings: string;
  export: string;
  demo: string;

  // Stats
  departmentsLabel: string;
  objectivesLabel: string;
  keyResultsLabel: string;
  avgScore: string;

  // Organization
  organizationScore: string;
  organizationScoreBreakdown: string;
  orgAverage: string;
  allDepartments: string;
  objectives: string;

  // Department View
  departmentScore: string;
  scoreSummary: string;
  backToDashboard: string;
  listView: string;
  gridView: string;
  noObjectivesYet: string;
  addObjectivesFromSettings: string;

  // Objective Card
  weight: string;
  keyResult: string;
  keyResults: string;
  avg: string;
  scoreAssessment: string;
  refreshScores: string;
  scoreLevel: string;
  averageScore: string;
  resultsBreakdown: string;
  actual: string;
  score: string;

  // Score Levels
  below: string;
  meets: string;
  good: string;
  veryGood: string;
  exceptional: string;

  // Metric Types
  higherIsBetter: string;
  lowerIsBetter: string;
  qualitative: string;

  // Settings Modal
  manageDepartmentsObjectivesKRs: string;
  createNewDepartment: string;
  departmentName: string;
  create: string;
  existingDepartments: string;
  delete: string;
  objective: string;
  createNewObjective: string;
  selectDepartment: string;
  objectiveName: string;
  weightPercent: string;
  existingObjectives: string;
  noObjectivesYetText: string;
  createNewKeyResult: string;
  selectObjective: string;
  keyResultName: string;
  descriptionOptional: string;
  unitExample: string;
  thresholdValues: string;
  levels: string;
  enterActualMetricValues: string;
  createKeyResult: string;
  existingKeyResults: string;
  noKeyResultsYet: string;

  // Score Levels Manager
  scoreLevelConfiguration: string;
  configureGlobalScoreLevels: string;
  levelName: string;
  scoreValue: string;
  colorClickToPick: string;
  preview: string;
  chooseAColor: string;
  customColor: string;
  close: string;
  addLevel: string;
  saveChanges: string;
  saving: string;
  resetToDefaults: string;
  unsavedChanges: string;
  failedToLoadScoreLevels: string;
  mustHaveAtLeast2Levels: string;
  scoreLevelsUpdated: string;
  failedToUpdateScoreLevels: string;
  resetConfirmation: string;
  scoreLevelsReset: string;
  failedToResetScoreLevels: string;
  newLevel: string;
  removeLevel: string;

  // Department Modal
  performanceDetails: string;

  // Speedometer
  rating: string;

  // Confirmations and Alerts
  confirmDeleteDepartment: string;
  confirmDeleteObjective: string;
  confirmDeleteKeyResult: string;
  confirmLoadDemoData: string;
  demoDataLoaded: string;
  failedToLoadDemoData: string;
  failedToCreateDepartment: string;
  failedToDeleteDepartment: string;
  failedToCreateObjective: string;
  failedToDeleteObjective: string;
  failedToCreateKeyResult: string;
  failedToDeleteKeyResult: string;
  failedToLoadDepartments: string;
  failedToExportExcel: string;

  // Loading
  loadingOKRTracker: string;

  // Language
  language: string;
  english: string;
  russian: string;
  uzbek: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // App Header
    appTitle: 'OKR Performance Tracker',
    organizationOverview: 'Organization Overview',
    departmentDetails: 'Details',

    // Sidebar
    controlPanel: 'Control Panel',
    departments: 'Departments',
    noDepartments: 'No departments',
    settings: 'Settings',
    export: 'Export',
    demo: 'Demo',

    // Stats
    departmentsLabel: 'Departments',
    objectivesLabel: 'Objectives',
    keyResultsLabel: 'Key Results',
    avgScore: 'Avg Score',

    // Organization
    organizationScore: 'Organization Score',
    organizationScoreBreakdown: 'Organization Score Breakdown',
    orgAverage: 'Org Average',
    allDepartments: 'All Departments',
    objectives: 'objectives',

    // Department View
    departmentScore: 'Department Score',
    scoreSummary: 'Score Summary',
    backToDashboard: 'Back to Dashboard',
    listView: 'List View',
    gridView: 'Grid View',
    noObjectivesYet: 'No Objectives Yet',
    addObjectivesFromSettings: 'Add objectives to this department from settings!',

    // Objective Card
    weight: 'Weight',
    keyResult: 'Key Result',
    keyResults: 'Key Results',
    avg: 'Avg',
    scoreAssessment: 'Score Assessment',
    refreshScores: 'Refresh Scores',
    scoreLevel: 'Score Level',
    averageScore: 'Average Score',
    resultsBreakdown: 'Results Breakdown',
    actual: 'Actual',
    score: 'Score',

    // Score Levels
    below: 'Below',
    meets: 'Meets',
    good: 'Good',
    veryGood: 'Very Good',
    exceptional: 'Exceptional',

    // Metric Types
    higherIsBetter: 'Higher is Better',
    lowerIsBetter: 'Lower is Better',
    qualitative: 'Qualitative',

    // Settings Modal
    manageDepartmentsObjectivesKRs: 'Manage departments, objectives, and key results',
    createNewDepartment: 'Create New Department',
    departmentName: 'Department name',
    create: 'Create',
    existingDepartments: 'Existing Departments',
    delete: 'Delete',
    objective: 'objective',
    createNewObjective: 'Create New Objective',
    selectDepartment: 'Select department',
    objectiveName: 'Objective name',
    weightPercent: 'Weight (%)',
    existingObjectives: 'Existing Objectives',
    noObjectivesYetText: 'No objectives yet',
    createNewKeyResult: 'Create New Key Result',
    selectObjective: 'Select objective',
    keyResultName: 'Key result name',
    descriptionOptional: 'Description (optional)',
    unitExample: 'Unit (e.g., %, $, users)',
    thresholdValues: 'Threshold Values',
    levels: 'levels',
    enterActualMetricValues: 'Enter the actual metric values that correspond to each score level',
    createKeyResult: 'Create Key Result',
    existingKeyResults: 'Existing Key Results',
    noKeyResultsYet: 'No key results yet',

    // Score Levels Manager
    scoreLevelConfiguration: 'Score Level Configuration',
    configureGlobalScoreLevels: 'Configure the global score levels. Changes are sorted by score value when saved.',
    levelName: 'Level Name',
    scoreValue: 'Score Value',
    colorClickToPick: 'Color (click to pick)',
    preview: 'Preview',
    chooseAColor: 'Choose a color:',
    customColor: 'Custom color:',
    close: 'Close',
    addLevel: 'Add Level',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    resetToDefaults: 'Reset to Defaults',
    unsavedChanges: '* You have unsaved changes',
    failedToLoadScoreLevels: 'Failed to load score levels',
    mustHaveAtLeast2Levels: 'You must have at least 2 score levels',
    scoreLevelsUpdated: 'Score levels updated successfully!',
    failedToUpdateScoreLevels: 'Failed to update score levels',
    resetConfirmation: 'Reset to default score levels? This will discard all customizations.',
    scoreLevelsReset: 'Score levels reset to defaults',
    failedToResetScoreLevels: 'Failed to reset score levels',
    newLevel: 'New Level',
    removeLevel: 'Remove level',

    // Department Modal
    performanceDetails: 'Performance Details',

    // Speedometer
    rating: 'Rating',

    // Confirmations and Alerts
    confirmDeleteDepartment: 'Are you sure you want to delete this department?',
    confirmDeleteObjective: 'Are you sure you want to delete this objective?',
    confirmDeleteKeyResult: 'Are you sure you want to delete this key result?',
    confirmLoadDemoData: 'This will replace all existing data with demo data. Continue?',
    demoDataLoaded: 'Demo data loaded successfully!',
    failedToLoadDemoData: 'Failed to load demo data',
    failedToCreateDepartment: 'Failed to create department',
    failedToDeleteDepartment: 'Failed to delete department',
    failedToCreateObjective: 'Failed to create objective',
    failedToDeleteObjective: 'Failed to delete objective',
    failedToCreateKeyResult: 'Failed to create key result',
    failedToDeleteKeyResult: 'Failed to delete key result',
    failedToLoadDepartments: 'Failed to load departments',
    failedToExportExcel: 'Failed to export Excel',

    // Loading
    loadingOKRTracker: 'Loading OKR Tracker...',

    // Language
    language: 'Language',
    english: 'English',
    russian: 'Russian',
    uzbek: 'Uzbek',
  },

  ru: {
    // App Header
    appTitle: 'OKR Трекер эффективности',
    organizationOverview: 'Обзор организации',
    departmentDetails: 'Детали',

    // Sidebar
    controlPanel: 'Панель управления',
    departments: 'Отделы',
    noDepartments: 'Нет отделов',
    settings: 'Настройки',
    export: 'Экспорт',
    demo: 'Демо',

    // Stats
    departmentsLabel: 'Отделы',
    objectivesLabel: 'Цели',
    keyResultsLabel: 'Ключевые результаты',
    avgScore: 'Средняя оценка',

    // Organization
    organizationScore: 'Оценка организации',
    organizationScoreBreakdown: 'Детализация оценки организации',
    orgAverage: 'Среднее по орг.',
    allDepartments: 'Все отделы',
    objectives: 'целей',

    // Department View
    departmentScore: 'Оценка отдела',
    scoreSummary: 'Сводка оценок',
    backToDashboard: 'Назад к панели',
    listView: 'Список',
    gridView: 'Сетка',
    noObjectivesYet: 'Пока нет целей',
    addObjectivesFromSettings: 'Добавьте цели для этого отдела в настройках!',

    // Objective Card
    weight: 'Вес',
    keyResult: 'Ключевой результат',
    keyResults: 'Ключевые результаты',
    avg: 'Сред.',
    scoreAssessment: 'Оценка показателей',
    refreshScores: 'Обновить оценки',
    scoreLevel: 'Уровень оценки',
    averageScore: 'Средняя оценка',
    resultsBreakdown: 'Детализация результатов',
    actual: 'Факт',
    score: 'Оценка',

    // Score Levels
    below: 'Ниже нормы',
    meets: 'Соответствует',
    good: 'Хорошо',
    veryGood: 'Очень хорошо',
    exceptional: 'Отлично',

    // Metric Types
    higherIsBetter: 'Больше - лучше',
    lowerIsBetter: 'Меньше - лучше',
    qualitative: 'Качественный',

    // Settings Modal
    manageDepartmentsObjectivesKRs: 'Управление отделами, целями и ключевыми результатами',
    createNewDepartment: 'Создать новый отдел',
    departmentName: 'Название отдела',
    create: 'Создать',
    existingDepartments: 'Существующие отделы',
    delete: 'Удалить',
    objective: 'цель',
    createNewObjective: 'Создать новую цель',
    selectDepartment: 'Выберите отдел',
    objectiveName: 'Название цели',
    weightPercent: 'Вес (%)',
    existingObjectives: 'Существующие цели',
    noObjectivesYetText: 'Пока нет целей',
    createNewKeyResult: 'Создать новый ключевой результат',
    selectObjective: 'Выберите цель',
    keyResultName: 'Название ключевого результата',
    descriptionOptional: 'Описание (необязательно)',
    unitExample: 'Единица измерения (напр., %, $, пользователи)',
    thresholdValues: 'Пороговые значения',
    levels: 'уровней',
    enterActualMetricValues: 'Введите фактические значения метрик, соответствующие каждому уровню оценки',
    createKeyResult: 'Создать ключевой результат',
    existingKeyResults: 'Существующие ключевые результаты',
    noKeyResultsYet: 'Пока нет ключевых результатов',

    // Score Levels Manager
    scoreLevelConfiguration: 'Настройка уровней оценки',
    configureGlobalScoreLevels: 'Настройте глобальные уровни оценки. При сохранении изменения сортируются по значению оценки.',
    levelName: 'Название уровня',
    scoreValue: 'Значение оценки',
    colorClickToPick: 'Цвет (нажмите для выбора)',
    preview: 'Предпросмотр',
    chooseAColor: 'Выберите цвет:',
    customColor: 'Свой цвет:',
    close: 'Закрыть',
    addLevel: 'Добавить уровень',
    saveChanges: 'Сохранить изменения',
    saving: 'Сохранение...',
    resetToDefaults: 'Сбросить на умолчания',
    unsavedChanges: '* Есть несохранённые изменения',
    failedToLoadScoreLevels: 'Не удалось загрузить уровни оценки',
    mustHaveAtLeast2Levels: 'Должно быть минимум 2 уровня оценки',
    scoreLevelsUpdated: 'Уровни оценки успешно обновлены!',
    failedToUpdateScoreLevels: 'Не удалось обновить уровни оценки',
    resetConfirmation: 'Сбросить на уровни по умолчанию? Все настройки будут потеряны.',
    scoreLevelsReset: 'Уровни оценки сброшены на значения по умолчанию',
    failedToResetScoreLevels: 'Не удалось сбросить уровни оценки',
    newLevel: 'Новый уровень',
    removeLevel: 'Удалить уровень',

    // Department Modal
    performanceDetails: 'Детали эффективности',

    // Speedometer
    rating: 'Рейтинг',

    // Confirmations and Alerts
    confirmDeleteDepartment: 'Вы уверены, что хотите удалить этот отдел?',
    confirmDeleteObjective: 'Вы уверены, что хотите удалить эту цель?',
    confirmDeleteKeyResult: 'Вы уверены, что хотите удалить этот ключевой результат?',
    confirmLoadDemoData: 'Это заменит все существующие данные демо-данными. Продолжить?',
    demoDataLoaded: 'Демо-данные успешно загружены!',
    failedToLoadDemoData: 'Не удалось загрузить демо-данные',
    failedToCreateDepartment: 'Не удалось создать отдел',
    failedToDeleteDepartment: 'Не удалось удалить отдел',
    failedToCreateObjective: 'Не удалось создать цель',
    failedToDeleteObjective: 'Не удалось удалить цель',
    failedToCreateKeyResult: 'Не удалось создать ключевой результат',
    failedToDeleteKeyResult: 'Не удалось удалить ключевой результат',
    failedToLoadDepartments: 'Не удалось загрузить отделы',
    failedToExportExcel: 'Не удалось экспортировать в Excel',

    // Loading
    loadingOKRTracker: 'Загрузка OKR Трекера...',

    // Language
    language: 'Язык',
    english: 'Английский',
    russian: 'Русский',
    uzbek: 'Узбекский',
  },

  uz: {
    // App Header
    appTitle: 'OKR Samaradorlik Kuzatuvchisi',
    organizationOverview: 'Tashkilot sharhi',
    departmentDetails: 'Tafsilotlar',

    // Sidebar
    controlPanel: 'Boshqaruv paneli',
    departments: "Bo'limlar",
    noDepartments: "Bo'limlar yo'q",
    settings: 'Sozlamalar',
    export: 'Eksport',
    demo: 'Demo',

    // Stats
    departmentsLabel: "Bo'limlar",
    objectivesLabel: 'Maqsadlar',
    keyResultsLabel: 'Asosiy natijalar',
    avgScore: "O'rtacha ball",

    // Organization
    organizationScore: 'Tashkilot bahosi',
    organizationScoreBreakdown: 'Tashkilot bahosi tafsiloti',
    orgAverage: "Tash. o'rtacha",
    allDepartments: "Barcha bo'limlar",
    objectives: 'maqsadlar',

    // Department View
    departmentScore: "Bo'lim bahosi",
    scoreSummary: 'Baholash xulosasi',
    backToDashboard: 'Bosh panelga qaytish',
    listView: "Ro'yxat",
    gridView: 'Jadval',
    noObjectivesYet: 'Hozircha maqsadlar yo\'q',
    addObjectivesFromSettings: "Sozlamalardan bu bo'limga maqsadlar qo'shing!",

    // Objective Card
    weight: "Og'irlik",
    keyResult: 'Asosiy natija',
    keyResults: 'Asosiy natijalar',
    avg: "O'rt.",
    scoreAssessment: 'Baholash ko\'rsatkichlari',
    refreshScores: 'Baholarni yangilash',
    scoreLevel: 'Baho darajasi',
    averageScore: "O'rtacha ball",
    resultsBreakdown: 'Natijalar tafsiloti',
    actual: 'Haqiqiy',
    score: 'Ball',

    // Score Levels
    below: 'Normadan past',
    meets: "Mos keladi",
    good: 'Yaxshi',
    veryGood: 'Juda yaxshi',
    exceptional: "A'lo",

    // Metric Types
    higherIsBetter: "Ko'proq - yaxshiroq",
    lowerIsBetter: 'Kamroq - yaxshiroq',
    qualitative: 'Sifat ko\'rsatkichi',

    // Settings Modal
    manageDepartmentsObjectivesKRs: "Bo'limlar, maqsadlar va asosiy natijalarni boshqarish",
    createNewDepartment: "Yangi bo'lim yaratish",
    departmentName: "Bo'lim nomi",
    create: 'Yaratish',
    existingDepartments: "Mavjud bo'limlar",
    delete: "O'chirish",
    objective: 'maqsad',
    createNewObjective: 'Yangi maqsad yaratish',
    selectDepartment: "Bo'limni tanlang",
    objectiveName: 'Maqsad nomi',
    weightPercent: "Og'irlik (%)",
    existingObjectives: 'Mavjud maqsadlar',
    noObjectivesYetText: "Hozircha maqsadlar yo'q",
    createNewKeyResult: 'Yangi asosiy natija yaratish',
    selectObjective: 'Maqsadni tanlang',
    keyResultName: 'Asosiy natija nomi',
    descriptionOptional: 'Tavsif (ixtiyoriy)',
    unitExample: "O'lchov birligi (masalan, %, $, foydalanuvchilar)",
    thresholdValues: 'Chegara qiymatlari',
    levels: 'daraja',
    enterActualMetricValues: 'Har bir baho darajasiga mos keladigan haqiqiy ko\'rsatkich qiymatlarini kiriting',
    createKeyResult: 'Asosiy natija yaratish',
    existingKeyResults: 'Mavjud asosiy natijalar',
    noKeyResultsYet: "Hozircha asosiy natijalar yo'q",

    // Score Levels Manager
    scoreLevelConfiguration: 'Baho darajalarini sozlash',
    configureGlobalScoreLevels: "Global baho darajalarini sozlang. O'zgarishlar saqlanganda baho qiymati bo'yicha saralanadi.",
    levelName: 'Daraja nomi',
    scoreValue: 'Baho qiymati',
    colorClickToPick: 'Rang (tanlash uchun bosing)',
    preview: "Ko'rib chiqish",
    chooseAColor: 'Rangni tanlang:',
    customColor: "Maxsus rang:",
    close: 'Yopish',
    addLevel: "Daraja qo'shish",
    saveChanges: "O'zgarishlarni saqlash",
    saving: 'Saqlanmoqda...',
    resetToDefaults: "Standartga qaytarish",
    unsavedChanges: "* Saqlanmagan o'zgarishlar mavjud",
    failedToLoadScoreLevels: "Baho darajalarini yuklab bo'lmadi",
    mustHaveAtLeast2Levels: "Kamida 2 ta baho darajasi bo'lishi kerak",
    scoreLevelsUpdated: 'Baho darajalari muvaffaqiyatli yangilandi!',
    failedToUpdateScoreLevels: "Baho darajalarini yangilab bo'lmadi",
    resetConfirmation: "Standart baho darajalariga qaytarilsinmi? Barcha sozlamalar yo'qoladi.",
    scoreLevelsReset: "Baho darajalari standart qiymatlarga qaytarildi",
    failedToResetScoreLevels: "Baho darajalarini qaytarib bo'lmadi",
    newLevel: 'Yangi daraja',
    removeLevel: "Darajani o'chirish",

    // Department Modal
    performanceDetails: 'Samaradorlik tafsilotlari',

    // Speedometer
    rating: 'Reyting',

    // Confirmations and Alerts
    confirmDeleteDepartment: "Bu bo'limni o'chirishni xohlaysizmi?",
    confirmDeleteObjective: "Bu maqsadni o'chirishni xohlaysizmi?",
    confirmDeleteKeyResult: "Bu asosiy natijani o'chirishni xohlaysizmi?",
    confirmLoadDemoData: "Bu barcha mavjud ma'lumotlarni demo ma'lumotlari bilan almashtiradi. Davom ettirilsinmi?",
    demoDataLoaded: "Demo ma'lumotlar muvaffaqiyatli yuklandi!",
    failedToLoadDemoData: "Demo ma'lumotlarni yuklab bo'lmadi",
    failedToCreateDepartment: "Bo'lim yaratib bo'lmadi",
    failedToDeleteDepartment: "Bo'limni o'chirib bo'lmadi",
    failedToCreateObjective: "Maqsad yaratib bo'lmadi",
    failedToDeleteObjective: "Maqsadni o'chirib bo'lmadi",
    failedToCreateKeyResult: "Asosiy natija yaratib bo'lmadi",
    failedToDeleteKeyResult: "Asosiy natijani o'chirib bo'lmadi",
    failedToLoadDepartments: "Bo'limlarni yuklab bo'lmadi",
    failedToExportExcel: "Excelga eksport qilib bo'lmadi",

    // Loading
    loadingOKRTracker: 'OKR Kuzatuvchisi yuklanmoqda...',

    // Language
    language: 'Til',
    english: 'Inglizcha',
    russian: 'Ruscha',
    uzbek: "O'zbekcha",
  }
};
