import ExcelJS from 'exceljs';

export const exportBookings = async (bookings: any[], settings: any) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Bookings');
  sheet.addRow(['Booking Number', 'Customer', 'Facility', 'Date', 'Time', 'Total']);
  // Add styling here
  return workbook.xlsx.writeBuffer();
};

export const exportExpenses = async (expenses: any[]) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Expenses');
  sheet.addRow(['Title', 'Amount', 'Date']);
  return workbook.xlsx.writeBuffer();
};

export const exportCustomers = async (customers: any[]) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Customers');
  sheet.addRow(['Name', 'Email', 'Phone']);
  return workbook.xlsx.writeBuffer();
};

export const exportPartnerDistribution = async (partners: any[], revenue: any, expenses: any) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Partner Distribution');
  sheet.addRow(['Partner', 'Share %', 'Amount']);
  return workbook.xlsx.writeBuffer();
};

export const exportFacilityPerformance = async (data: any) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Performance');
  sheet.addRow(['Facility', 'Bookings', 'Revenue']);
  return workbook.xlsx.writeBuffer();
};
