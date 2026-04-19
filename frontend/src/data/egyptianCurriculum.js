// src/data/egyptianCurriculum.js
// Complete Egyptian Ministry of Education curriculum
// Covers: Primary (1-6), Preparatory (7-9), Secondary (10-12)
// Plus: University faculties with departments and courses

export const SCHOOL_CURRICULUM = {
  primary: {
    nameAr: 'المرحلة الابتدائية',
    nameEn: 'Primary Stage',
    grades: [
      {
        grade: 1, nameAr: 'الصف الأول الابتدائي', nameEn: 'Grade 1',
        subjects: [
          { id: 'ar-1', nameAr: 'اللغة العربية', nameEn: 'Arabic', isCore: true, units: [] },
          { id: 'math-1', nameAr: 'الرياضيات', nameEn: 'Mathematics', isCore: true, units: [] },
          { id: 'en-1', nameAr: 'اللغة الإنجليزية', nameEn: 'English', isCore: true, units: [] },
          { id: 'rel-1', nameAr: 'التربية الدينية', nameEn: 'Religious Education', isCore: true, isPassFail: true, units: [] },
          { id: 'sci-1', nameAr: 'العلوم', nameEn: 'Science', isCore: true, units: [] },
          { id: 'art-1', nameAr: 'التربية الفنية', nameEn: 'Art Education', isCore: false, isPassFail: true, units: [] },
          { id: 'pe-1', nameAr: 'التربية البدنية والصحية', nameEn: 'PE & Health', isCore: false, isPassFail: true, units: [] },
          { id: 'mus-1', nameAr: 'التربية الموسيقية', nameEn: 'Music', isCore: false, isPassFail: true, units: [] },
        ],
      },
      {
        grade: 2, nameAr: 'الصف الثاني الابتدائي', nameEn: 'Grade 2',
        subjects: [
          { id: 'ar-2', nameAr: 'اللغة العربية', nameEn: 'Arabic', isCore: true, units: [] },
          { id: 'math-2', nameAr: 'الرياضيات', nameEn: 'Mathematics', isCore: true, units: [] },
          { id: 'en-2', nameAr: 'اللغة الإنجليزية', nameEn: 'English', isCore: true, units: [] },
          { id: 'rel-2', nameAr: 'التربية الدينية', nameEn: 'Religious Education', isCore: true, isPassFail: true, units: [] },
          { id: 'sci-2', nameAr: 'العلوم', nameEn: 'Science', isCore: true, units: [] },
          { id: 'art-2', nameAr: 'التربية الفنية', nameEn: 'Art', isCore: false, isPassFail: true, units: [] },
          { id: 'pe-2', nameAr: 'التربية البدنية', nameEn: 'PE', isCore: false, isPassFail: true, units: [] },
          { id: 'mus-2', nameAr: 'التربية الموسيقية', nameEn: 'Music', isCore: false, isPassFail: true, units: [] },
        ],
      },
      {
        grade: 3, nameAr: 'الصف الثالث الابتدائي', nameEn: 'Grade 3',
        subjects: [
          { id: 'ar-3', nameAr: 'اللغة العربية', nameEn: 'Arabic', isCore: true, units: [] },
          { id: 'math-3', nameAr: 'الرياضيات', nameEn: 'Mathematics', isCore: true, units: [] },
          { id: 'en-3', nameAr: 'اللغة الإنجليزية', nameEn: 'English', isCore: true, units: [] },
          { id: 'rel-3', nameAr: 'التربية الدينية', nameEn: 'Religious Education', isCore: true, isPassFail: true, units: [] },
          { id: 'sci-3', nameAr: 'العلوم', nameEn: 'Science', isCore: true, units: [] },
          { id: 'art-3', nameAr: 'التربية الفنية', nameEn: 'Art', isCore: false, isPassFail: true, units: [] },
          { id: 'pe-3', nameAr: 'التربية البدنية', nameEn: 'PE', isCore: false, isPassFail: true, units: [] },
          { id: 'mus-3', nameAr: 'التربية الموسيقية', nameEn: 'Music', isCore: false, isPassFail: true, units: [] },
        ],
      },
      ...[4, 5, 6].map(g => ({
        grade: g, nameAr: `الصف ${g===4?'الرابع':g===5?'الخامس':'السادس'} الابتدائي`, nameEn: `Grade ${g}`,
        subjects: [
          { id: `ar-${g}`, nameAr: 'اللغة العربية', nameEn: 'Arabic', isCore: true, units: [] },
          { id: `math-${g}`, nameAr: 'الرياضيات', nameEn: 'Mathematics', isCore: true, units: [] },
          { id: `en-${g}`, nameAr: 'اللغة الإنجليزية', nameEn: 'English', isCore: true, units: [] },
          { id: `rel-${g}`, nameAr: 'التربية الدينية', nameEn: 'Religious Ed', isCore: true, isPassFail: true, units: [] },
          { id: `sci-${g}`, nameAr: 'العلوم', nameEn: 'Science', isCore: true, units: [] },
          { id: `ss-${g}`, nameAr: 'الدراسات الاجتماعية', nameEn: 'Social Studies', isCore: true, units: [] },
          { id: `ict-${g}`, nameAr: 'تكنولوجيا المعلومات', nameEn: 'ICT', isCore: true, isPassFail: true, units: [] },
          { id: `voc-${g}`, nameAr: 'المهارات المهنية', nameEn: 'Vocational Skills', isCore: true, isPassFail: true, units: [] },
          { id: `val-${g}`, nameAr: 'القيم واحترام الآخر', nameEn: 'Values', isCore: false, isPassFail: true, units: [] },
          { id: `tok-${g}`, nameAr: 'أنشطة التوكاتسو', nameEn: 'Tokatsu', isCore: false, isPassFail: true, units: [] },
          { id: `art-${g}`, nameAr: 'التربية الفنية', nameEn: 'Art', isCore: false, isPassFail: true, units: [] },
          { id: `pe-${g}`, nameAr: 'التربية الرياضية', nameEn: 'PE', isCore: false, isPassFail: true, units: [] },
          { id: `mus-${g}`, nameAr: 'التربية الموسيقية', nameEn: 'Music', isCore: false, isPassFail: true, units: [] },
        ]
      }))
    ],
  },
  preparatory: {
    nameAr: 'المرحلة الإعدادية',
    nameEn: 'Preparatory Stage',
    grades: [
      ...[7, 8, 9].map(g => ({
        grade: g, nameAr: `الصف ${g===7?'الأول':g===8?'الثاني':'الثالث'} الإعدادي`, nameEn: `Grade ${g}`,
        subjects: [
          { id: `ar-${g}`, nameAr: 'اللغة العربية والخط', nameEn: 'Arabic & Calligraphy', isCore: true, units: [] },
          { id: `en-${g}`, nameAr: 'اللغة الإنجليزية', nameEn: 'English', isCore: true, units: [] },
          { id: `math-${g}`, nameAr: 'الرياضيات', nameEn: 'Mathematics', isCore: true, units: [] },
          { id: `sci-${g}`, nameAr: 'العلوم', nameEn: 'Science', isCore: true, units: [] },
          { id: `ss-${g}`, nameAr: 'الدراسات الاجتماعية', nameEn: 'Social Studies', isCore: true, units: [] },
          // 2nd lang is excluded for G7 natively, but core for G8 & G9
          ...(g > 7 ? [{ id: `fl2-${g}`, nameAr: 'لغة أجنبية ثانية', nameEn: '2nd Foreign Lang.', isCore: true, units: [] }] : []),
          { id: `rel-${g}`, nameAr: 'التربية الدينية', nameEn: 'Religious Ed', isCore: true, isPassFail: true, units: [] },
          { id: `art-${g}`, nameAr: 'التربية الفنية', nameEn: 'Art', isCore: false, isPassFail: true, units: [] },
          { id: `pe-${g}`, nameAr: 'التربية الرياضية', nameEn: 'PE', isCore: false, isPassFail: true, units: [] },
          { id: `mus-${g}`, nameAr: 'التربية الموسيقية', nameEn: 'Music', isCore: false, isPassFail: true, units: [] },
          { id: `comp-${g}`, nameAr: 'الكمبيوتر وتكنولوجيا المعلومات', nameEn: 'Computer & IT', isCore: false, isPassFail: true, units: [] },
        ]
      }))
    ]
  },
  secondary: {
    nameAr: 'المرحلة الثانوية',
    nameEn: 'Secondary Stage',
    grades: [
      {
        grade: 10, nameAr: 'الصف الأول الثانوي', nameEn: 'Grade 10',
        tracks: ['general'],
        subjects: {
          core: [
            { id: 'ar-10', nameAr: 'اللغة العربية', nameEn: 'Arabic', isCore: true, units: [] },
            { id: 'fl1-10', nameAr: 'اللغة الأجنبية الأولى', nameEn: '1st Foreign Language', isCore: true, units: [] },
            { id: 'hist-10', nameAr: 'التاريخ', nameEn: 'History', isCore: true, units: [] },
            { id: 'math-10', nameAr: 'الرياضيات', nameEn: 'Mathematics', isCore: true, units: [] },
            { id: 'isc-10', nameAr: 'العلوم المتكاملة', nameEn: 'Integrated Sciences', isCore: true, units: [] },
            { id: 'phil-10', nameAr: 'الفلسفة والمنطق', nameEn: 'Philosophy & Logic', isCore: true, units: [] },
          ],
          passfail: [
            { id: 'rel-10', nameAr: 'التربية الدينية', nameEn: 'Religious Education', isPassFail: true, units: [] },
            { id: 'fl2-10', nameAr: 'اللغة الأجنبية الثانية', nameEn: '2nd Foreign Language', isPassFail: true, units: [] },
            { id: 'civics-10', nameAr: 'التربية الوطنية', nameEn: 'Civics', isPassFail: true, units: [] },
          ]
        }
      },
      {
        grade: 11, nameAr: 'الصف الثاني الثانوي', nameEn: 'Grade 11',
        tracks: ['science', 'math', 'arts'],
        subjects: {
          core: [
            { id: 'ar-11', nameAr: 'اللغة العربية', nameEn: 'Arabic', isCore: true, units: [] },
            { id: 'fl1-11', nameAr: 'اللغة الأجنبية الأولى', nameEn: '1st Foreign Language', isCore: true, units: [] },
          ],
          science: [ // علمي علوم
            { id: 'math-11', nameAr: 'الرياضيات', nameEn: 'Mathematics', isCore: true, units: [] },
            { id: 'bio-11', nameAr: 'الأحياء', nameEn: 'Biology', isCore: true, units: [] },
            { id: 'chem-11', nameAr: 'الكيمياء', nameEn: 'Chemistry', isCore: true, units: [] },
            { id: 'phys-11', nameAr: 'الفيزياء', nameEn: 'Physics', isCore: true, units: [] },
          ],
          math: [ // علمي رياضة
            { id: 'math-11m', nameAr: 'الرياضيات', nameEn: 'Mathematics', isCore: true, units: [] },
            { id: 'chem-11m', nameAr: 'الكيمياء', nameEn: 'Chemistry', isCore: true, units: [] },
            { id: 'phys-11m', nameAr: 'الفيزياء', nameEn: 'Physics', isCore: true, units: [] },
          ],
          arts: [ // أدبي
            { id: 'hist-11', nameAr: 'التاريخ', nameEn: 'History', isCore: true, units: [] },
            { id: 'geo-11', nameAr: 'الجغرافيا', nameEn: 'Geography', isCore: true, units: [] },
            { id: 'psych-11', nameAr: 'علم النفس والاجتماع', nameEn: 'Psychology', isCore: true, units: [] },
            { id: 'math-11a', nameAr: 'الرياضيات', nameEn: 'Mathematics', isCore: true, units: [] },
          ],
          passfail: [
            { id: 'rel-11', nameAr: 'التربية الدينية', nameEn: 'Religious Education', isPassFail: true, units: [] },
            { id: 'fl2-11', nameAr: 'اللغة الأجنبية الثانية', nameEn: '2nd Foreign Language', isPassFail: true, units: [] },
            { id: 'civics-11', nameAr: 'التربية الوطنية', nameEn: 'National Education', isPassFail: true, units: [] },
            { id: 'stat-11', nameAr: 'الاقتصاد والإحصاء', nameEn: 'Economics & Statistics', isPassFail: true, units: [] },
          ]
        }
      },
      {
        grade: 12, nameAr: 'الصف الثالث الثانوي', nameEn: 'Grade 12',
        tracks: ['science', 'math', 'arts'],
        subjects: {
          core: [
            { id: 'ar-12', nameAr: 'اللغة العربية', nameEn: 'Arabic', isCore: true, units: [] },
            { id: 'fl1-12', nameAr: 'اللغة الأجنبية الأولى', nameEn: '1st Foreign Language', isCore: true, units: [] },
          ],
          science: [ // علمي علوم (5 subjects total)
            { id: 'bio-12', nameAr: 'الأحياء', nameEn: 'Biology', isCore: true, units: [] },
            { id: 'chem-12', nameAr: 'الكيمياء', nameEn: 'Chemistry', isCore: true, units: [] },
            { id: 'phys-12', nameAr: 'الفيزياء', nameEn: 'Physics', isCore: true, units: [] },
          ],
          math: [ // علمي رياضة
            { id: 'math-12m', nameAr: 'الرياضيات', nameEn: 'Mathematics', isCore: true, units: [] },
            { id: 'chem-12m', nameAr: 'الكيمياء', nameEn: 'Chemistry', isCore: true, units: [] },
            { id: 'phys-12m', nameAr: 'الفيزياء', nameEn: 'Physics', isCore: true, units: [] },
          ],
          arts: [ // أدبي
            { id: 'hist-12', nameAr: 'التاريخ', nameEn: 'History', isCore: true, units: [] },
            { id: 'geo-12', nameAr: 'الجغرافيا', nameEn: 'Geography', isCore: true, units: [] },
            { id: 'stat-12', nameAr: 'الإحصاء', nameEn: 'Statistics', isCore: true, units: [] },
          ],
          passfail: [
            { id: 'rel-12', nameAr: 'التربية الدينية', nameEn: 'Religious Education', isPassFail: true, units: [] },
            { id: 'fl2-12', nameAr: 'اللغة الأجنبية الثانية', nameEn: '2nd Foreign Language', isPassFail: true, units: [] },
            { id: 'civics-12', nameAr: 'التربية الوطنية', nameEn: 'National Education', isPassFail: true, units: [] },
            { id: 'eco-12', nameAr: 'الاقتصاد', nameEn: 'Economics', isPassFail: true, units: [] },
          ]
        }
      }
    ]
  }
};


// ── Egyptian University Curriculum ─────────────────────────
export const UNIVERSITY_CURRICULUM = {
  faculties: [
    {
      id: 'eng',
      nameAr: 'كلية الهندسة',
      nameEn: 'Faculty of Engineering',
      years: 5,
      departments: [
        {
          id: 'cs', nameAr: 'هندسة الحاسبات والذكاء الاصطناعي', nameEn: 'Computer Science & AI',
          courses: [
            { year: 1, semester: 'Fall',   code: 'CS101', nameAr: 'مقدمة برمجة', nameEn: 'Intro to Programming (Python/C++)', credits: 3 },
            { year: 1, semester: 'Fall',   code: 'MATH101', nameAr: 'رياضيات هندسية ١', nameEn: 'Engineering Math I', credits: 3 },
            { year: 1, semester: 'Spring', code: 'CS102', nameAr: 'بنية البيانات والخوارزميات', nameEn: 'Data Structures & Algorithms', credits: 3 },
            { year: 2, semester: 'Fall',   code: 'CS201', nameAr: 'قواعد البيانات', nameEn: 'Database Systems', credits: 3 },
            { year: 2, semester: 'Fall',   code: 'CS202', nameAr: 'شبكات الحاسب', nameEn: 'Computer Networks', credits: 3 },
            { year: 2, semester: 'Spring', code: 'CS203', nameAr: 'نظم التشغيل', nameEn: 'Operating Systems', credits: 3 },
            { year: 3, semester: 'Fall',   code: 'CS301', nameAr: 'تصميم المحولات والدوائر الرقمية', nameEn: 'Digital Logic Design', credits: 3 },
            { year: 3, semester: 'Fall',   code: 'CS302', nameAr: 'هندسة البرمجيات', nameEn: 'Software Engineering', credits: 3 },
            { year: 3, semester: 'Spring', code: 'AI301', nameAr: 'مقدمة الذكاء الاصطناعي', nameEn: 'Intro to Artificial Intelligence', credits: 3 },
            { year: 4, semester: 'Fall',   code: 'AI401', nameAr: 'تعلم الآلة', nameEn: 'Machine Learning', credits: 3 },
            { year: 4, semester: 'Spring', code: 'AI402', nameAr: 'التعلم العميق', nameEn: 'Deep Learning', credits: 3 },
            { year: 5, semester: 'Fall',   code: 'CS501', nameAr: 'مشروع التخرج ١', nameEn: 'Graduation Project I', credits: 6 },
            { year: 5, semester: 'Spring', code: 'CS502', nameAr: 'مشروع التخرج ٢', nameEn: 'Graduation Project II', credits: 6 },
          ],
        },
        {
          id: 'elec', nameAr: 'الهندسة الكهربية', nameEn: 'Electrical Engineering',
          courses: [
            { year: 1, semester: 'Fall', code: 'EE101', nameAr: 'دوائر كهربية ١', nameEn: 'Electric Circuits I', credits: 3 },
            { year: 2, semester: 'Fall', code: 'EE201', nameAr: 'إلكترونيات ١', nameEn: 'Electronics I', credits: 3 },
            { year: 3, semester: 'Fall', code: 'EE301', nameAr: 'آلات كهربية', nameEn: 'Electric Machines', credits: 3 },
            { year: 4, semester: 'Fall', code: 'EE401', nameAr: 'نظم القوى الكهربية', nameEn: 'Power Systems', credits: 3 },
          ],
        },
        {
          id: 'civil', nameAr: 'الهندسة المدنية', nameEn: 'Civil Engineering',
          courses: [
            { year: 1, semester: 'Fall', code: 'CE101', nameAr: 'ميكانيكا للمهندسين', nameEn: 'Mechanics for Engineers', credits: 3 },
            { year: 2, semester: 'Fall', code: 'CE201', nameAr: 'مقاومة المواد', nameEn: 'Strength of Materials', credits: 3 },
            { year: 3, semester: 'Fall', code: 'CE301', nameAr: 'تصميم الخرسانة المسلحة', nameEn: 'Reinforced Concrete Design', credits: 3 },
            { year: 4, semester: 'Fall', code: 'CE401', nameAr: 'إدارة المشاريع الإنشائية', nameEn: 'Construction Project Management', credits: 3 },
          ],
        },
      ],
    },
    {
      id: 'med',
      nameAr: 'كلية الطب البشري',
      nameEn: 'Faculty of Medicine',
      years: 6,
      departments: [
        {
          id: 'med-gen', nameAr: 'الطب العام', nameEn: 'General Medicine',
          courses: [
            { year: 1, semester: 'Annual', code: 'MED101', nameAr: 'التشريح', nameEn: 'Anatomy', credits: 6 },
            { year: 1, semester: 'Annual', code: 'MED102', nameAr: 'الكيمياء الحيوية', nameEn: 'Biochemistry', credits: 4 },
            { year: 2, semester: 'Annual', code: 'MED201', nameAr: 'الفسيولوجيا', nameEn: 'Physiology', credits: 6 },
            { year: 2, semester: 'Annual', code: 'MED202', nameAr: 'علم الأنسجة', nameEn: 'Histology', credits: 4 },
            { year: 3, semester: 'Annual', code: 'MED301', nameAr: 'الباثولوجيا', nameEn: 'Pathology', credits: 6 },
            { year: 3, semester: 'Annual', code: 'MED302', nameAr: 'الميكروبيولوجيا', nameEn: 'Microbiology', credits: 4 },
            { year: 4, semester: 'Annual', code: 'MED401', nameAr: 'الطب الداخلي', nameEn: 'Internal Medicine (Clinical)', credits: 8 },
            { year: 4, semester: 'Annual', code: 'MED402', nameAr: 'الجراحة', nameEn: 'Surgery (Clinical)', credits: 8 },
            { year: 5, semester: 'Annual', code: 'MED501', nameAr: 'طب الأطفال', nameEn: 'Pediatrics', credits: 6 },
            { year: 5, semester: 'Annual', code: 'MED502', nameAr: 'النساء والتوليد', nameEn: 'Obstetrics & Gynecology', credits: 6 },
            { year: 6, semester: 'Annual', code: 'MED601', nameAr: 'الامتياز العام', nameEn: 'General Internship', credits: 12 },
          ],
        },
      ],
    },
    {
      id: 'commerce',
      nameAr: 'كلية التجارة',
      nameEn: 'Faculty of Commerce',
      years: 4,
      departments: [
        {
          id: 'acc', nameAr: 'المحاسبة', nameEn: 'Accounting',
          courses: [
            { year: 1, semester: 'Fall',   code: 'ACC101', nameAr: 'مبادئ المحاسبة ١', nameEn: 'Principles of Accounting I', credits: 3 },
            { year: 1, semester: 'Spring', code: 'ACC102', nameAr: 'مبادئ المحاسبة ٢', nameEn: 'Principles of Accounting II', credits: 3 },
            { year: 2, semester: 'Fall',   code: 'ACC201', nameAr: 'محاسبة التكاليف', nameEn: 'Cost Accounting', credits: 3 },
            { year: 2, semester: 'Spring', code: 'ACC202', nameAr: 'محاسبة الشركات', nameEn: 'Corporate Accounting', credits: 3 },
            { year: 3, semester: 'Fall',   code: 'ACC301', nameAr: 'مراجعة وتدقيق', nameEn: 'Auditing & Assurance', credits: 3 },
            { year: 3, semester: 'Spring', code: 'ACC302', nameAr: 'محاسبة إدارية', nameEn: 'Managerial Accounting', credits: 3 },
            { year: 4, semester: 'Fall',   code: 'ACC401', nameAr: 'المعايير الدولية IFRS', nameEn: 'International Financial Reporting (IFRS)', credits: 3 },
          ],
        },
        {
          id: 'bus', nameAr: 'إدارة الأعمال', nameEn: 'Business Administration',
          courses: [
            { year: 1, semester: 'Fall', code: 'BUS101', nameAr: 'مبادئ الإدارة', nameEn: 'Principles of Management', credits: 3 },
            { year: 2, semester: 'Fall', code: 'BUS201', nameAr: 'إدارة التسويق', nameEn: 'Marketing Management', credits: 3 },
            { year: 3, semester: 'Fall', code: 'BUS301', nameAr: 'إدارة الموارد البشرية', nameEn: 'Human Resource Management', credits: 3 },
            { year: 4, semester: 'Fall', code: 'BUS401', nameAr: 'الإدارة الاستراتيجية', nameEn: 'Strategic Management', credits: 3 },
          ],
        },
        {
          id: 'eco', nameAr: 'الاقتصاد', nameEn: 'Economics',
          courses: [
            { year: 1, semester: 'Fall', code: 'ECO101', nameAr: 'مبادئ الاقتصاد الجزئي', nameEn: 'Microeconomics', credits: 3 },
            { year: 2, semester: 'Fall', code: 'ECO201', nameAr: 'الاقتصاد الكلي', nameEn: 'Macroeconomics', credits: 3 },
            { year: 3, semester: 'Fall', code: 'ECO301', nameAr: 'اقتصاديات التنمية', nameEn: 'Development Economics', credits: 3 },
          ],
        },
      ],
    },
    {
      id: 'sci',
      nameAr: 'كلية العلوم',
      nameEn: 'Faculty of Science',
      years: 4,
      departments: [
        { id: 'math-dept', nameAr: 'الرياضيات', nameEn: 'Mathematics', courses: [
          { year: 1, semester: 'Fall', code: 'MATH101', nameAr: 'التفاضل والتكامل ١', nameEn: 'Calculus I', credits: 3 },
          { year: 1, semester: 'Spring', code: 'MATH102', nameAr: 'التفاضل والتكامل ٢', nameEn: 'Calculus II', credits: 3 },
          { year: 2, semester: 'Fall', code: 'MATH201', nameAr: 'الجبر الخطي', nameEn: 'Linear Algebra', credits: 3 },
          { year: 2, semester: 'Spring', code: 'MATH202', nameAr: 'المعادلات التفاضلية', nameEn: 'Differential Equations', credits: 3 },
          { year: 3, semester: 'Fall', code: 'MATH301', nameAr: 'التحليل الرياضي', nameEn: 'Real Analysis', credits: 3 },
          { year: 4, semester: 'Fall', code: 'MATH401', nameAr: 'نظرية الأعداد', nameEn: 'Number Theory', credits: 3 },
        ]},
        { id: 'phys-dept', nameAr: 'الفيزياء', nameEn: 'Physics', courses: [
          { year: 1, semester: 'Fall', code: 'PHYS101', nameAr: 'ميكانيكا كلاسيكية', nameEn: 'Classical Mechanics', credits: 3 },
          { year: 2, semester: 'Fall', code: 'PHYS201', nameAr: 'كهرومغناطيسية', nameEn: 'Electromagnetism', credits: 3 },
          { year: 3, semester: 'Fall', code: 'PHYS301', nameAr: 'ميكانيكا الكم', nameEn: 'Quantum Mechanics', credits: 3 },
          { year: 4, semester: 'Fall', code: 'PHYS401', nameAr: 'الفيزياء النووية', nameEn: 'Nuclear Physics', credits: 3 },
        ]},
        { id: 'chem-dept', nameAr: 'الكيمياء', nameEn: 'Chemistry', courses: [
          { year: 1, semester: 'Fall', code: 'CHEM101', nameAr: 'الكيمياء العامة', nameEn: 'General Chemistry', credits: 3 },
          { year: 2, semester: 'Fall', code: 'CHEM201', nameAr: 'الكيمياء العضوية', nameEn: 'Organic Chemistry', credits: 3 },
          { year: 3, semester: 'Fall', code: 'CHEM301', nameAr: 'الكيمياء التحليلية', nameEn: 'Analytical Chemistry', credits: 3 },
        ]},
      ],
    },
    {
      id: 'law',
      nameAr: 'كلية الحقوق',
      nameEn: 'Faculty of Law',
      years: 4,
      departments: [
        { id: 'law-gen', nameAr: 'القانون العام', nameEn: 'Public Law', courses: [
          { year: 1, semester: 'Fall', code: 'LAW101', nameAr: 'مدخل لعلم القانون', nameEn: 'Introduction to Law', credits: 3 },
          { year: 1, semester: 'Spring', code: 'LAW102', nameAr: 'القانون الدستوري', nameEn: 'Constitutional Law', credits: 3 },
          { year: 2, semester: 'Fall', code: 'LAW201', nameAr: 'القانون المدني', nameEn: 'Civil Law', credits: 3 },
          { year: 2, semester: 'Spring', code: 'LAW202', nameAr: 'قانون العقوبات', nameEn: 'Criminal Law', credits: 3 },
          { year: 3, semester: 'Fall', code: 'LAW301', nameAr: 'قانون الإجراءات المدنية', nameEn: 'Civil Procedure', credits: 3 },
          { year: 4, semester: 'Fall', code: 'LAW401', nameAr: 'القانون الدولي الخاص', nameEn: 'Private International Law', credits: 3 },
        ]},
      ],
    },
    {
      id: 'arts',
      nameAr: 'كلية الآداب',
      nameEn: 'Faculty of Arts',
      years: 4,
      departments: [
        { id: 'arabic', nameAr: 'قسم اللغة العربية', nameEn: 'Arabic Language Dept', courses: [
          { year: 1, semester: 'Fall', code: 'ARA101', nameAr: 'النحو والصرف ١', nameEn: 'Grammar I', credits: 3 },
          { year: 2, semester: 'Fall', code: 'ARA201', nameAr: 'الأدب الجاهلي', nameEn: 'Pre-Islamic Literature', credits: 3 },
          { year: 3, semester: 'Fall', code: 'ARA301', nameAr: 'النقد الأدبي', nameEn: 'Literary Criticism', credits: 3 },
        ]},
        { id: 'english', nameAr: 'قسم اللغة الإنجليزية', nameEn: 'English Language Dept', courses: [
          { year: 1, semester: 'Fall', code: 'ENG101', nameAr: 'اللغويات التطبيقية', nameEn: 'Applied Linguistics', credits: 3 },
          { year: 2, semester: 'Fall', code: 'ENG201', nameAr: 'الأدب الإنجليزي', nameEn: 'English Literature', credits: 3 },
          { year: 3, semester: 'Fall', code: 'ENG301', nameAr: 'المسرح والرواية', nameEn: 'Drama & Fiction', credits: 3 },
        ]},
        { id: 'hist', nameAr: 'قسم التاريخ', nameEn: 'History Dept', courses: [
          { year: 1, semester: 'Fall', code: 'HIS101', nameAr: 'تاريخ مصر القديمة', nameEn: 'Ancient Egyptian History', credits: 3 },
          { year: 2, semester: 'Fall', code: 'HIS201', nameAr: 'التاريخ الإسلامي', nameEn: 'Islamic History', credits: 3 },
          { year: 3, semester: 'Fall', code: 'HIS301', nameAr: 'تاريخ مصر الحديث', nameEn: 'Modern Egyptian History', credits: 3 },
        ]},
      ],
    },
    {
      id: 'pharm',
      nameAr: 'كلية الصيدلة',
      nameEn: 'Faculty of Pharmacy',
      years: 5,
      departments: [
        { id: 'pharm-gen', nameAr: 'الصيدلة العامة', nameEn: 'General Pharmacy', courses: [
          { year: 1, semester: 'Annual', code: 'PH101', nameAr: 'الكيمياء العضوية الصيدلية', nameEn: 'Pharmaceutical Organic Chemistry', credits: 4 },
          { year: 2, semester: 'Annual', code: 'PH201', nameAr: 'علم العقاقير', nameEn: 'Pharmacognosy', credits: 4 },
          { year: 3, semester: 'Annual', code: 'PH301', nameAr: 'الفارماكولوجي', nameEn: 'Pharmacology', credits: 5 },
          { year: 4, semester: 'Annual', code: 'PH401', nameAr: 'صناعة الأدوية', nameEn: 'Pharmaceutics', credits: 5 },
          { year: 5, semester: 'Annual', code: 'PH501', nameAr: 'التدريب الميداني', nameEn: 'Clinical Training', credits: 8 },
        ]},
      ],
    },
  ],
};

// ── Helpers ────────────────────────────────────────────────
export const getFacultyById = (id) =>
  UNIVERSITY_CURRICULUM.faculties.find(f => f.id === id);

export const getDepartmentById = (facultyId, deptId) =>
  getFacultyById(facultyId)?.departments.find(d => d.id === deptId);

export const getSchoolGrades = () => [
  ...SCHOOL_CURRICULUM.primary.grades,
  ...SCHOOL_CURRICULUM.preparatory.grades,
  ...SCHOOL_CURRICULUM.secondary.grades,
];

export const ALL_FLAT_SUBJECTS = getSchoolGrades().flatMap(g =>
  (Array.isArray(g.subjects) ? g.subjects : [
    ...(g.subjects?.core || []),
    ...(g.subjects?.science || []),
    ...(g.subjects?.arts || []),
  ]).map(s => ({ ...s, grade: g.grade, gradeAr: g.nameAr }))
);
