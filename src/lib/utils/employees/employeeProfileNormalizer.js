import {
  firstValue,
  getProfileSibsId,
  normalizeList,
} from "./employeeProfileHelpers.js";

export function normalizeEmployeeData(employee) {
  return {
    ...(employee || {}),

    sibsId: getProfileSibsId(employee),

    firstName: firstValue(
      employee?.firstName,
      employee?.first_name,
      employee?.gy_emp_fname,
      employee?.candidateFirstName,
      employee?.candidate_first_name,
    ),

    middleName: firstValue(
      employee?.middleName,
      employee?.middle_name,
      employee?.gy_emp_mname,
      employee?.candidateMiddleName,
      employee?.candidate_middle_name,
    ),

    lastName: firstValue(
      employee?.lastName,
      employee?.last_name,
      employee?.gy_emp_lname,
      employee?.candidateLastName,
      employee?.candidate_last_name,
    ),

    nameExtension: firstValue(
      employee?.nameExtension,
      employee?.name_extension,
      employee?.extensionName,
      employee?.extension_name,
    ),

    preferredName: firstValue(
      employee?.preferredName,
      employee?.preferred_name,
      employee?.nickname,
    ),

    birthdate: firstValue(
      employee?.birthdate,
      employee?.birthDate,
      employee?.dateOfBirth,
      employee?.date_of_birth,
      employee?.gy_emp_dob,
    ),

    placeOfBirth: firstValue(
      employee?.placeOfBirth,
      employee?.place_of_birth,
      employee?.birthPlace,
      employee?.birth_place,
    ),

    gender: firstValue(employee?.gender, employee?.sex, employee?.gy_emp_gender),

    civilStatus: firstValue(
      employee?.civilStatus,
      employee?.civil_status,
      employee?.maritalStatus,
      employee?.marital_status,
      employee?.gy_emp_civil_status,
    ),

    citizenship: firstValue(
      employee?.citizenship,
      employee?.nationality,
      employee?.country,
    ),

    email: firstValue(
      employee?.email,
      employee?.emailAddress,
      employee?.email_address,
      employee?.gy_email,
      employee?.gy_user_email,
    ),

    contact: firstValue(
      employee?.contact,
      employee?.contactNum,
      employee?.contactNumber,
      employee?.mobileNumber,
      employee?.mobile_number,
      employee?.gy_contact_num,
    ),

    telephone: firstValue(
      employee?.telephone,
      employee?.telephoneNumber,
      employee?.telephone_number,
    ),

    residentialAddress: firstValue(
      employee?.residentialAddress,
      employee?.residential_address,
      employee?.homeAddress,
      employee?.address,
      employee?.location,
    ),

    permanentAddress: firstValue(
      employee?.permanentAddress,
      employee?.permanent_address,
      employee?.homeAddress,
      employee?.address,
      employee?.location,
    ),

    location: firstValue(
      employee?.location,
      employee?.assignedLocation,
      employee?.assigned_location,
      employee?.site,
      employee?.gy_assignedloc,
    ),

    height: firstValue(employee?.height),
    weight: firstValue(employee?.weight),
    bloodType: firstValue(employee?.bloodType, employee?.blood_type),

    gsis: firstValue(employee?.gsis, employee?.gsisNo, employee?.gsis_no),
    sss: firstValue(employee?.sss, employee?.sssNo, employee?.sss_no),
    phic: firstValue(
      employee?.phic,
      employee?.philhealth,
      employee?.philhealthNo,
      employee?.philhealth_no,
    ),
    hdmf: firstValue(
      employee?.hdmf,
      employee?.pagibig,
      employee?.pagibigNo,
      employee?.pagibig_no,
    ),
    tin: firstValue(employee?.tin, employee?.tinNo, employee?.tin_no),

    department: firstValue(
      employee?.department,
      employee?.departmentName,
      employee?.department_name,
      employee?.gy_department,
    ),
    account: firstValue(
      employee?.account,
      employee?.accountName,
      employee?.account_name,
      employee?.gy_account,
    ),

    position: firstValue(
      employee?.position,
      employee?.positionName,
      employee?.position_name,
      employee?.positionTitle,
      employee?.position_title,
      employee?.jobTitle,
      employee?.job_title,
      employee?.jobPosition,
      employee?.job_position,
      employee?.roleTitle,
      employee?.role_title,
      employee?.designation,
      employee?.employeePosition,
      employee?.employee_position,
      employee?.gy_emp_position,
      employee?.appliedPosition,
      employee?.applied_position,
    ),

    hireDate: firstValue(
      employee?.hireDate,
      employee?.hire_date,
      employee?.dateHired,
      employee?.date_hired,
      employee?.gy_emp_hiredate,
    ),

    status: firstValue(
      employee?.status,
      employee?.employmentStatus,
      employee?.candidateStatus,
      employee?.candidate_status,
      "Active",
    ),

    workSetup: firstValue(
      employee?.workSetup,
      employee?.work_setup,
      employee?.workArrangement,
      employee?.work_arrangement,
      employee?.setup,
      "On-site",
    ),

    manager: firstValue(
      employee?.manager,
      employee?.supervisor,
      employee?.accountManager,
      employee?.recruiter,
    ),

    spouseSurname: firstValue(employee?.spouseSurname, employee?.spouse_surname),
    spouseFirstName: firstValue(
      employee?.spouseFirstName,
      employee?.spouse_first_name,
    ),
    spouseMiddleName: firstValue(
      employee?.spouseMiddleName,
      employee?.spouse_middle_name,
    ),
    spouseOccupation: firstValue(
      employee?.spouseOccupation,
      employee?.spouse_occupation,
    ),
    spouseEmployer: firstValue(
      employee?.spouseEmployer,
      employee?.spouse_employer,
      employee?.spouseEmployerBusiness,
    ),
    spouseBusinessAddress: firstValue(
      employee?.spouseBusinessAddress,
      employee?.spouse_business_address,
    ),
    spouseTelephone: firstValue(
      employee?.spouseTelephone,
      employee?.spouse_telephone,
    ),

    fatherSurname: firstValue(employee?.fatherSurname, employee?.father_surname),
    fatherFirstName: firstValue(
      employee?.fatherFirstName,
      employee?.father_first_name,
    ),
    fatherMiddleName: firstValue(
      employee?.fatherMiddleName,
      employee?.father_middle_name,
    ),

    motherMaidenSurname: firstValue(
      employee?.motherMaidenSurname,
      employee?.mother_maiden_surname,
      employee?.motherSurname,
      employee?.mother_surname,
    ),
    motherFirstName: firstValue(
      employee?.motherFirstName,
      employee?.mother_first_name,
    ),
    motherMiddleName: firstValue(
      employee?.motherMiddleName,
      employee?.mother_middle_name,
    ),

    children: normalizeList(employee?.children),

    emergencyName: firstValue(
      employee?.emergencyName,
      employee?.emergencyContactName,
      employee?.emergency_contact_name,
    ),
    emergencyRelationship: firstValue(
      employee?.emergencyRelationship,
      employee?.emergencyContactRelationship,
      employee?.emergency_contact_relationship,
    ),
    emergencyPhone: firstValue(
      employee?.emergencyPhone,
      employee?.emergencyContactNumber,
      employee?.emergency_contact_number,
    ),
    emergencyEmail: firstValue(
      employee?.emergencyEmail,
      employee?.emergency_contact_email,
    ),

    education: normalizeList(employee?.education),
    eligibility: normalizeList(
      employee?.eligibility || employee?.civilServiceEligibility,
    ),
    experience: normalizeList(employee?.experience || employee?.workExperience),
    trainings: normalizeList(employee?.trainings || employee?.training),
    skills: normalizeList(employee?.skills),
    recognitions: normalizeList(employee?.recognitions || employee?.awards),
    organizations: normalizeList(employee?.organizations),
    references: normalizeList(employee?.references),

    appliedPosition: firstValue(
      employee?.appliedPosition,
      employee?.applied_position,
      employee?.position,
      employee?.jobTitle,
    ),
    preferredAccount: firstValue(
      employee?.preferredAccount,
      employee?.preferred_account,
      employee?.account,
      employee?.accountName,
    ),
    source: firstValue(employee?.source, employee?.candidateSource),
    pipelineStage: firstValue(
      employee?.pipelineStage,
      employee?.currentPipelineStage,
      employee?.currentStage,
      employee?.stage,
    ),
    prfMatchStatus: firstValue(
      employee?.prfMatchStatus,
      employee?.prf_match_status,
      employee?.matchStatus,
    ),
    expectedSalary: firstValue(
      employee?.expectedSalary,
      employee?.expected_salary,
    ),
    availability: firstValue(employee?.availability, employee?.availableDate),
    recruiter: firstValue(employee?.recruiter, employee?.recruiterName),
    assessmentStatus: firstValue(
      employee?.assessmentStatus,
      employee?.assessment_status,
    ),
    assessmentScore: firstValue(employee?.assessmentScore, employee?.score),
    assessmentRemarks: firstValue(
      employee?.assessmentRemarks,
      employee?.assessment_remarks,
      employee?.evaluationRemarks,
    ),
    remarks: firstValue(employee?.remarks, employee?.recruitmentRemarks),
    statusHistory: normalizeList(
      employee?.statusHistory || employee?.status_history,
    ),

    documents: normalizeList(
      employee?.documents || employee?.attachments || employee?.uploadedDocuments,
    ),
    notes: firstValue(employee?.notes, employee?.privateNotes),
    notesHistory: normalizeList(employee?.notesHistory || employee?.notes_history),

    updatedAt: firstValue(
      employee?.updatedAt,
      employee?.updated_at,
      employee?.modifiedAt,
    ),
    updatedBy: firstValue(employee?.updatedBy, employee?.updated_by),
  };
}


export function buildEditableEmployee(employee) {
  return normalizeEmployeeData(employee);
}

