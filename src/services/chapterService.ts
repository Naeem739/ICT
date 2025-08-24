import { doc, getDoc, getDocs, collection, query, orderBy, updateDoc, deleteDoc, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Chapter {
  id?: string;
  title: string;
  description: string;
  order: number;
  tutorials?: Tutorial[];
  practiceSections?: PracticeSection[];
  examSections?: ExamSection[];
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  links: string[];
}

export interface PracticeSection {
  id: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  questions: string[];
  answers: string[];
  answerType: 'text' | 'code' | 'image' | 'mixed';
  answerImageUrl?: string;
}

export interface ExamSection {
  id: string;
  title: string;
  description: string;
  questions: string[];
  options: string[][];
  correctAnswers: number[];
  timeLimit: number;
  passingScore: number;
}

// Chapter CRUD operations
export const createChapter = async (chapterData: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt' | 'tutorials' | 'practiceSections' | 'examSections'>) => {
  try {
    // Check if chapter with same title already exists
    const existingChapters = await getDocs(
      query(collection(db, 'chapters'), where('title', '==', chapterData.title))
    );
    
    if (!existingChapters.empty) {
      throw new Error(`Chapter "${chapterData.title}" already exists`);
    }
    
    const docRef = await addDoc(collection(db, 'chapters'), {
      ...chapterData,
      tutorials: [],
      practiceSections: [],
      examSections: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, ...chapterData };
  } catch (error) {
    console.error('Error creating chapter:', error);
    throw error;
  }
};

export const getChapters = async (): Promise<Chapter[]> => {
  try {
    const chaptersQuery = query(collection(db, 'chapters'), orderBy('order'));
    const querySnapshot = await getDocs(chaptersQuery);
    const chapters: Chapter[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      chapters.push({
        id: doc.id,
        title: data.title,
        description: data.description,
        order: data.order,
        tutorials: data.tutorials || [],
        practiceSections: data.practiceSections || [],
        examSections: data.examSections || []
      });
    });
    
    return chapters;
  } catch (error) {
    console.error('Error getting chapters:', error);
    return [];
  }
};

export const updateChapter = async (chapterId: string, chapterData: Partial<Chapter>) => {
  try {
    const chapterRef = doc(db, 'chapters', chapterId);
    await updateDoc(chapterRef, {
      ...chapterData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating chapter:', error);
    throw error;
  }
};

export const deleteChapter = async (chapterId: string) => {
  try {
    await deleteDoc(doc(db, 'chapters', chapterId));
  } catch (error) {
    console.error('Error deleting chapter:', error);
    throw error;
  }
};

export const deleteAllChapters = async () => {
  try {
    const chaptersSnapshot = await getDocs(collection(db, 'chapters'));
    const deletePromises = chaptersSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error('Error deleting all chapters:', error);
    throw error;
  }
};

export const createDefaultChapters = async () => {
  try {
    const defaultChapters = [
      {
        title: 'Chapter 1',
        description: 'Introduction to ICT fundamentals and basic concepts',
        tutorials: [],
        practiceSections: [],
        examSections: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        title: 'Chapter 2',
        description: 'Computer hardware and system components',
        tutorials: [],
        practiceSections: [],
        examSections: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        title: 'Chapter 3',
        description: 'Software applications and operating systems',
        tutorials: [],
        practiceSections: [],
        examSections: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        title: 'Chapter 4',
        description: 'Networking and internet technologies',
        tutorials: [],
        practiceSections: [],
        examSections: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        title: 'Chapter 5',
        description: 'Database management and data handling',
        tutorials: [],
        practiceSections: [],
        examSections: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        title: 'Chapter 6',
        description: 'Cybersecurity and digital safety practices',
        tutorials: [],
        practiceSections: [],
        examSections: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    ];

    const createPromises = defaultChapters.map(chapter => addDoc(collection(db, 'chapters'), chapter));
    await Promise.all(createPromises);
    return true;
  } catch (error) {
    console.error('Error creating default chapters:', error);
    throw error;
  }
};

// Tutorial CRUD operations
export const addTutorialToChapter = async (chapterId: string, tutorialData: Omit<Tutorial, 'id'>): Promise<void> => {
  try {
    const chapterRef = doc(db, 'chapters', chapterId);
    const chapterDoc = await getDoc(chapterRef);
    
    if (!chapterDoc.exists()) {
      throw new Error('Chapter not found');
    }
    
    const chapterData = chapterDoc.data();
    const tutorials = chapterData.tutorials || [];
    
    const newTutorial: Tutorial = {
      id: Date.now().toString(), // Simple ID generation
      ...tutorialData
    };
    
    tutorials.push(newTutorial);
    
    await updateDoc(chapterRef, { tutorials });
  } catch (error) {
    console.error('Error adding tutorial to chapter:', error);
    throw error;
  }
};

export const updateTutorialInChapter = async (chapterId: string, tutorialId: string, updatedTutorial: Omit<Tutorial, 'id' | 'createdAt'>) => {
  try {
    const chapterRef = doc(db, 'chapters', chapterId);
    const chapterDoc = await getDoc(chapterRef);
    
    if (!chapterDoc.exists()) {
      throw new Error('Chapter not found');
    }
    
    const chapter = chapterDoc.data() as Chapter;
    const tutorials = chapter.tutorials || [];
    
    const tutorialIndex = tutorials.findIndex(t => t.id === tutorialId);
    if (tutorialIndex === -1) {
      throw new Error('Tutorial not found');
    }
    
    const updatedTutorials = [...tutorials];
    updatedTutorials[tutorialIndex] = {
      ...updatedTutorial,
      id: tutorialId,
      createdAt: tutorials[tutorialIndex].createdAt // Preserve original creation date
    };
    
    await updateDoc(chapterRef, {
      tutorials: updatedTutorials,
      updatedAt: serverTimestamp()
    });
    
    return updatedTutorials[tutorialIndex];
  } catch (error) {
    console.error('Error updating tutorial:', error);
    throw error;
  }
};

export const deleteTutorialFromChapter = async (chapterId: string, tutorialId: string) => {
  try {
    const chapterRef = doc(db, 'chapters', chapterId);
    const chapterDoc = await getDoc(chapterRef);
    
    if (!chapterDoc.exists()) {
      throw new Error('Chapter not found');
    }
    
    const chapter = chapterDoc.data() as Chapter;
    const tutorials = chapter.tutorials || [];
    
    const updatedTutorials = tutorials.filter(t => t.id !== tutorialId);
    
    await updateDoc(chapterRef, {
      tutorials: updatedTutorials,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting tutorial:', error);
    throw error;
  }
};

// Practice Section CRUD operations
export const addPracticeSectionToChapter = async (chapterId: string, practice: Omit<PracticeSection, 'id' | 'createdAt'>) => {
  try {
    const chapterRef = doc(db, 'chapters', chapterId);
    
    // Filter out undefined values to avoid Firebase errors
    const practiceData: Partial<PracticeSection> & { id: string; createdAt: string } = {
      id: Date.now().toString(), // Generate a unique ID
      createdAt: new Date().toISOString() // Use regular Date instead of serverTimestamp
    };

    // Only add defined values
    if (practice.title !== undefined) practiceData.title = practice.title;
    if (practice.description !== undefined) practiceData.description = practice.description;
    if (practice.imageUrl !== undefined) practiceData.imageUrl = practice.imageUrl;
    if (practice.questions !== undefined) practiceData.questions = practice.questions;
    if (practice.answers !== undefined) practiceData.answers = practice.answers;
    if (practice.answerType !== undefined) practiceData.answerType = practice.answerType;
    if (practice.answerImageUrl !== undefined) practiceData.answerImageUrl = practice.answerImageUrl;
    
    await updateDoc(chapterRef, {
      practiceSections: arrayUnion(practiceData),
      updatedAt: serverTimestamp()
    });
    
    return practiceData;
  } catch (error) {
    console.error('Error adding practice section:', error);
    throw error;
  }
};

export const updatePracticeSectionInChapter = async (chapterId: string, practiceId: string, updatedPractice: Omit<PracticeSection, 'id' | 'createdAt'>) => {
  try {
    const chapterRef = doc(db, 'chapters', chapterId);
    const chapterDoc = await getDoc(chapterRef);
    
    if (!chapterDoc.exists()) {
      throw new Error('Chapter not found');
    }
    
    const chapter = chapterDoc.data() as Chapter;
    const practiceSections = chapter.practiceSections || [];
    
    const practiceIndex = practiceSections.findIndex(p => p.id === practiceId);
    if (practiceIndex === -1) {
      throw new Error('Practice section not found');
    }
    
    const updatedPracticeSections = [...practiceSections];
    
    // Filter out undefined values to avoid Firebase errors
    const practiceData: Partial<PracticeSection> & { id: string; createdAt: string } = {
      id: practiceId,
      createdAt: practiceSections[practiceIndex].createdAt // Preserve original creation date
    };

    // Only add defined values
    if (updatedPractice.title !== undefined) practiceData.title = updatedPractice.title;
    if (updatedPractice.description !== undefined) practiceData.description = updatedPractice.description;
    if (updatedPractice.imageUrl !== undefined) practiceData.imageUrl = updatedPractice.imageUrl;
    if (updatedPractice.questions !== undefined) practiceData.questions = updatedPractice.questions;
    if (updatedPractice.answers !== undefined) practiceData.answers = updatedPractice.answers;
    if (updatedPractice.answerType !== undefined) practiceData.answerType = updatedPractice.answerType;
    if (updatedPractice.answerImageUrl !== undefined) practiceData.answerImageUrl = updatedPractice.answerImageUrl;
    
    updatedPracticeSections[practiceIndex] = practiceData;
    
    await updateDoc(chapterRef, {
      practiceSections: updatedPracticeSections,
      updatedAt: serverTimestamp()
    });
    
    return updatedPracticeSections[practiceIndex];
  } catch (error) {
    console.error('Error updating practice section:', error);
    throw error;
  }
};

export const deletePracticeSectionFromChapter = async (chapterId: string, practiceId: string) => {
  try {
    const chapterRef = doc(db, 'chapters', chapterId);
    const chapterDoc = await getDoc(chapterRef);
    
    if (!chapterDoc.exists()) {
      throw new Error('Chapter not found');
    }
    
    const chapter = chapterDoc.data() as Chapter;
    const practiceSections = chapter.practiceSections || [];
    
    const updatedPracticeSections = practiceSections.filter(p => p.id !== practiceId);
    
    await updateDoc(chapterRef, {
      practiceSections: updatedPracticeSections,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting practice section:', error);
    throw error;
  }
};

// Exam Section CRUD operations
export const addExamSectionToChapter = async (chapterId: string, examSection: Omit<ExamSection, 'id' | 'createdAt'>) => {
  try {
    const chapterRef = doc(db, 'chapters', chapterId);
    const newExam: ExamSection = {
      ...examSection,
      id: Date.now().toString(), // Generate a unique ID
      createdAt: new Date().toISOString() // Use regular Date instead of serverTimestamp
    };
    
    await updateDoc(chapterRef, {
      examSections: arrayUnion(newExam),
      updatedAt: serverTimestamp()
    });
    
    return newExam;
  } catch (error) {
    console.error('Error adding exam section:', error);
    throw error;
  }
};

export const updateExamSectionInChapter = async (chapterId: string, examId: string, updatedExam: Partial<ExamSection>) => {
  try {
    const chapterRef = doc(db, 'chapters', chapterId);
    const chapterDoc = await getDoc(chapterRef);
    
    if (!chapterDoc.exists()) {
      throw new Error('Chapter not found');
    }
    
    const chapter = chapterDoc.data() as Chapter;
    const examSections = chapter.examSections || [];
    
    const examIndex = examSections.findIndex(e => e.id === examId);
    if (examIndex === -1) {
      throw new Error('Exam section not found');
    }
    
    const updatedExamSections = [...examSections];
    updatedExamSections[examIndex] = {
      ...updatedExamSections[examIndex],
      ...updatedExam,
      id: examId,
      createdAt: examSections[examIndex].createdAt // Preserve original creation date
    };
    
    await updateDoc(chapterRef, {
      examSections: updatedExamSections,
      updatedAt: serverTimestamp()
    });
    
    return updatedExamSections[examIndex];
  } catch (error) {
    console.error('Error updating exam section:', error);
    throw error;
  }
};

export const deleteExamSectionFromChapter = async (chapterId: string, examId: string) => {
  try {
    const chapterRef = doc(db, 'chapters', chapterId);
    const chapterDoc = await getDoc(chapterRef);
    
    if (!chapterDoc.exists()) {
      throw new Error('Chapter not found');
    }
    
    const chapter = chapterDoc.data() as Chapter;
    const examSections = chapter.examSections || [];
    
    const updatedExamSections = examSections.filter(e => e.id !== examId);
    
    await updateDoc(chapterRef, {
      examSections: updatedExamSections,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting exam section:', error);
    throw error;
  }
};

// Helper function to get complete chapter data
export const getChapterWithAllData = async (chapterId: string) => {
  try {
    const chapterRef = doc(db, 'chapters', chapterId);
    const chapterDoc = await getDoc(chapterRef);
    
    if (!chapterDoc.exists()) {
      throw new Error('Chapter not found');
    }
    
    const chapter = { id: chapterDoc.id, ...chapterDoc.data() } as Chapter;
    return chapter;
  } catch (error) {
    console.error('Error getting chapter with all data:', error);
    throw error;
  }
};

// Function to clean up duplicate chapters
export const cleanupDuplicateChapters = async () => {
  try {
    console.log('Cleaning up duplicate chapters...');
    
    const chaptersSnapshot = await getDocs(collection(db, 'chapters'));
    const chapters = chaptersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Group chapters by title
    const chaptersByTitle = chapters.reduce((acc, chapter) => {
      if (!acc[chapter.title]) {
        acc[chapter.title] = [];
      }
      acc[chapter.title].push(chapter);
      return acc;
    }, {} as Record<string, Chapter[]>);
    
    // Delete duplicate chapters, keeping only the first one
    for (const [title, chapterList] of Object.entries(chaptersByTitle)) {
      if (chapterList.length > 1) {
        console.log(`Found ${chapterList.length} duplicates for "${title}", keeping the first one`);
        
        // Keep the first chapter, delete the rest
        const chaptersToDelete = chapterList.slice(1);
        for (const chapter of chaptersToDelete) {
          await deleteDoc(doc(db, 'chapters', chapter.id));
          console.log(`Deleted duplicate chapter: ${chapter.title} (${chapter.id})`);
        }
      }
    }
    
    console.log('Cleanup completed successfully!');
    return true;
  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
};
