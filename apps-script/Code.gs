// GradeFlow Google Sheets API

function doGet(e) {
  return handleResponse(e, 'GET');
}

function doPost(e) {
  return handleResponse(e, 'POST');
}

function handleResponse(e, method) {
  try {
    let action = e.parameter.action;
    let data = {};

    if (method === 'POST' && e.postData && e.postData.contents) {
      const payload = JSON.parse(e.postData.contents);
      action = payload.action || action;
      data = payload.data || {};
    } else {
      data = e.parameter;
    }

    if (!action) return responseError('Action is required');

    const db = SpreadsheetApp.getActiveSpreadsheet();

    switch(action) {
      case 'ping':
        return responseSuccess({ message: 'GradeFlow API is running!' });
      case 'getSemesters':
        return responseSuccess(getRecords(db.getSheetByName('Semesters'), data.user_id));
      case 'addSemester':
        return responseSuccess(addRecord(db.getSheetByName('Semesters'), [data.id, data.user_id, data.name, data.academic_year]));
      case 'getSubjects':
        return responseSuccess(getRecords(db.getSheetByName('Subjects'), data.user_id));
      case 'addSubject':
        return responseSuccess(addRecord(db.getSheetByName('Subjects'), [data.id, data.semester_id, data.user_id, data.code, data.name, data.credits, data.grade, data.gradePoint]));
      case 'updateSubject':
        return responseSuccess(updateRecord(db.getSheetByName('Subjects'), data.id, data.user_id, [data.id, data.semester_id, data.user_id, data.code, data.name, data.credits, data.grade, data.gradePoint]));
      case 'deleteSubject':
        return responseSuccess(deleteRecord(db.getSheetByName('Subjects'), data.id, data.user_id));
      case 'getSettings':
        return responseSuccess(getSettings(db.getSheetByName('Settings'), data.user_id));
      case 'saveSettings':
        return responseSuccess(saveSettings(db.getSheetByName('Settings'), data.user_id, data.grading_scale, data.class_boundaries));
      case 'getPlanner':
        return responseSuccess(getPlanner(getPlannerSheet(db), data.user_id));
      case 'savePlanner':
        return responseSuccess(savePlanner(getPlannerSheet(db), data.user_id, data.plans));
      default:
        return responseError('Invalid Action: ' + action);
    }
  } catch (error) {
    return responseError(error.toString());
  }
}

function getPlannerSheet(db) {
  let sheet = db.getSheetByName('Planner');
  if (!sheet) {
    sheet = db.insertSheet('Planner');
    sheet.appendRow(['user_id', 'plans']);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(['user_id', 'plans']);
  }
  return sheet;
}

function getPlanner(sheet, userId) {
  if (!userId) return [];
  const data = sheet.getDataRange().getValues();
  const headers = data[0] || [];
  const userIndex = headers.indexOf('user_id');
  const plansIndex = headers.indexOf('plans');
  if (userIndex === -1 || plansIndex === -1) throw new Error('Planner headers missing');
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][userIndex]) === String(userId)) {
      try { return JSON.parse(data[i][plansIndex] || '[]'); }
      catch (error) { throw new Error('Saved planner data is invalid JSON'); }
    }
  }
  return [];
}

function savePlanner(sheet, userId, plans) {
  if (!userId) throw new Error('User ID is required');
  const planData = typeof plans === 'string' ? plans : JSON.stringify(plans || []);
  JSON.parse(planData || '[]');
  const data = sheet.getDataRange().getValues();
  const headers = data[0] || [];
  const userIndex = headers.indexOf('user_id');
  const plansIndex = headers.indexOf('plans');
  if (userIndex === -1 || plansIndex === -1) throw new Error('Planner headers missing');
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][userIndex]) === String(userId)) {
      sheet.getRange(i + 1, plansIndex + 1).setValue(planData);
      return { updated: true };
    }
  }
  const row = new Array(headers.length).fill('');
  row[userIndex] = userId;
  row[plansIndex] = planData;
  sheet.appendRow(row);
  return { inserted: true };
}

function getRecords(sheet, userId) {
  if (!sheet) throw new Error('Sheet not found');
  if (!userId) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  const records = [];
  const userIdColIndex = headers.indexOf('user_id');
  if (userIdColIndex === -1) return [];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][userIdColIndex]) === String(userId)) {
      const record = {};
      for (let j = 0; j < headers.length; j++) record[headers[j]] = data[i][j];
      records.push(record);
    }
  }
  return records;
}

function getSettings(sheet, userId) {
  if (!sheet) throw new Error('Sheet not found');
  if (!userId) return null;
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return null;
  const headers = data[0];
  const userIdColIndex = headers.indexOf('user_id');
  if (userIdColIndex === -1) return null;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][userIdColIndex]) === String(userId)) {
      const record = {};
      for (let j = 0; j < headers.length; j++) record[headers[j]] = data[i][j];
      return record;
    }
  }
  return null;
}

function saveSettings(sheet, userId, gradingScale, classBoundaries) {
  if (!sheet) throw new Error('Sheet not found');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const userIdIndex = headers.indexOf('user_id');
  const gradingScaleIndex = headers.indexOf('grading_scale');
  const classBoundariesIndex = headers.indexOf('class_boundaries');
  if (userIdIndex === -1) throw new Error('Headers missing');
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][userIdIndex]) === String(userId)) {
      const rowData = [...data[i]];
      rowData[gradingScaleIndex] = gradingScale;
      rowData[classBoundariesIndex] = classBoundaries;
      sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
      return { updated: true };
    }
  }
  const newRow = new Array(headers.length).fill('');
  newRow[userIdIndex] = userId;
  newRow[gradingScaleIndex] = gradingScale;
  newRow[classBoundariesIndex] = classBoundaries;
  sheet.appendRow(newRow);
  return { inserted: true };
}

function addRecord(sheet, rowData) {
  if (!sheet) throw new Error('Sheet not found');
  sheet.appendRow(rowData);
  return { inserted: true };
}

function updateRecord(sheet, id, userId, rowData) {
  if (!sheet) throw new Error('Sheet not found');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf('id');
  const userIdIndex = headers.indexOf('user_id');
  if (idIndex === -1 || userIdIndex === -1) throw new Error('Headers missing');
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]) === String(id) && String(data[i][userIdIndex]) === String(userId)) {
      sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
      return { updated: true };
    }
  }
  return { updated: false, message: 'Record not found' };
}

function deleteRecord(sheet, id, userId) {
  if (!sheet) throw new Error('Sheet not found');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf('id');
  const userIdIndex = headers.indexOf('user_id');
  if (idIndex === -1 || userIdIndex === -1) throw new Error('Headers missing');
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]) === String(id) && String(data[i][userIdIndex]) === String(userId)) {
      sheet.deleteRow(i + 1);
      return { deleted: true };
    }
  }
  return { deleted: false, message: 'Record not found' };
}

function responseSuccess(data) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function responseError(message) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: message }))
    .setMimeType(ContentService.MimeType.JSON);
}
