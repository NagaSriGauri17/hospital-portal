import login from './translations/login';
import dashboard from './translations/dashboard';
import doctors from './translations/doctors';
import schedule from './translations/schedule';
import emergency from './translations/emergency';
import lab from './translations/lab';
import payments from './translations/payments';
import reviews from './translations/reviews';
import queue from './translations/queue';
import insurance from './translations/insurance';
import records from './translations/records';
import walkin from './translations/walkin';
import appointments from './translations/appointments';

const baseTranslations = {
  en: {
    appName: 'ArogyaCare',
    login: 'Login',
    signup: 'Sign Up',
    dashboard: 'Dashboard',
    queueManagement: 'Queue Management',
    appointments: 'Appointments',
    walkinBooking: 'Walk-in Booking',
    uploadRecords: 'Upload Records',
    scheduleSetup: 'Schedule Setup',
    doctors: 'Doctors',
    labTests: 'Lab Tests',
    emergency: 'Emergency',
    insurance: 'Insurance',
    payments: 'Payments',
    reviews: 'Reviews',
    logout: 'Logout',
    language: 'Language',
    liveQueue: 'Live Queue',
    inProgress: 'In Progress',
    nextWaiting: 'Next / Waiting',
    completed: 'Completed',
    noOneInProgress: 'No one currently in progress',
    noOneWaiting: 'No one waiting',
    noOneCompleted: 'No one checked out yet',
    patient: 'Patient',
  },
  hi: {
    appName: 'आरोग्यकेयर',
    login: 'लॉगिन',
    signup: 'साइन अप करें',
    dashboard: 'डैशबोर्ड',
    queueManagement: 'कतार प्रबंधन',
    appointments: 'अपॉइंटमेंट्स',
    walkinBooking: 'वॉक-इन बुकिंग',
    uploadRecords: 'रिकॉर्ड अपलोड करें',
    scheduleSetup: 'शेड्यूल सेटअप',
    doctors: 'डॉक्टर',
    labTests: 'लैब टेस्ट',
    emergency: 'आपातकाल',
    insurance: 'बीमा',
    payments: 'भुगतान',
    reviews: 'समीक्षाएं',
    logout: 'लॉगआउट',
    language: 'भाषा',
    liveQueue: 'लाइव कतार',
    inProgress: 'चल रहा है',
    nextWaiting: 'अगला / प्रतीक्षारत',
    completed: 'पूर्ण',
    noOneInProgress: 'अभी कोई नहीं देखा जा रहा',
    noOneWaiting: 'कोई प्रतीक्षा में नहीं',
    noOneCompleted: 'आज तक कोई पूर्ण नहीं हुआ',
    patient: 'मरीज़',
  },
  te: {
    appName: 'ఆరోగ్యకేర్',
    login: 'లాగిన్',
    signup: 'సైన్ అప్',
    dashboard: 'డాష్‌బోర్డ్',
    queueManagement: 'క్యూ నిర్వహణ',
    appointments: 'అపాయింట్‌మెంట్లు',
    walkinBooking: 'వాక్-ఇన్ బుకింగ్',
    uploadRecords: 'రికార్డులు అప్‌లోడ్ చేయండి',
    scheduleSetup: 'షెడ్యూల్ సెటప్',
    doctors: 'డాక్టర్లు',
    labTests: 'ల్యాబ్ టెస్టులు',
    emergency: 'అత్యవసరం',
    insurance: 'బీమా',
    payments: 'చెల్లింపులు',
    reviews: 'సమీక్షలు',
    logout: 'లాగ్అవుట్',
    language: 'భాష',
    liveQueue: 'లైవ్ క్యూ',
    inProgress: 'ప్రోగ్రెస్‌లో ఉంది',
    nextWaiting: 'తదుపరి / వేచి ఉంది',
    completed: 'పూర్తయింది',
    noOneInProgress: 'ప్రస్తుతం ఎవరూ చూడబడటం లేదు',
    noOneWaiting: 'ఎవరూ వేచి లేరు',
    noOneCompleted: 'ఈరోజు ఎవరూ పూర్తి కాలేదు',
    patient: 'రోగి',
  },
};

// Merge the shared keys above with each page's own translation file
const pageModules = [login, dashboard, doctors, schedule, emergency, lab, payments, reviews, queue, insurance, records, walkin, appointments];

export const translations = { en: { ...baseTranslations.en }, hi: { ...baseTranslations.hi }, te: { ...baseTranslations.te } };
for (const mod of pageModules) {
  for (const lang of ['en', 'hi', 'te']) Object.assign(translations[lang], mod[lang]);
}

// Locale used for dates and numbers
export const locales = { en: 'en-IN', hi: 'hi-IN', te: 'te-IN' };
