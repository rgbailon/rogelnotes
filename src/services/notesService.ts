import { NoteData } from '../../server/controllers/notesController';

const API_BASE_URL = '/api';

// Fetch all notes from the database
export const fetchNotesFromDB = async (): Promise<NoteData[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/notes`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching notes from database:', error);
    throw error;
  }
};

// Save a note to the database
export const saveNoteToDB = async (note: Omit<NoteData, 'id' | 'created_at' | 'updated_at'>): Promise<NoteData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(note),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error saving note to database:', error);
    throw error;
  }
};

// Update a note in the database
export const updateNoteInDB = async (id: number, note: Partial<Omit<NoteData, 'id' | 'created_at' | 'updated_at'>>): Promise<NoteData> => {
  try {
    console.log('Updating note:', { id, note });
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(note),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Update failed:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error updating note in database:', error);
    throw error;
  }
};

// Delete a note from the database
export const deleteNoteFromDB = async (id: number): Promise<NoteData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error deleting note from database:', error);
    throw error;
  }
};

// Convert DB note to frontend note format
export const convertDbNoteToFrontend = (dbNote: NoteData): any => {
  // Convert the database note format to the frontend note format
  // This depends on the specific structure of your frontend note types
  
  const baseNote = {
    id: dbNote.id,
    title: dbNote.title,
    date: dbNote.created_at ? new Date(dbNote.created_at).toLocaleDateString() : 'Unknown',
    color: dbNote.color || '#ffffff',
  };
  
  // Determine the type and convert accordingly
  switch (dbNote.type) {
    case 'checklist':
      // Assuming checklist items are stored as JSON in content field
      try {
        const items = dbNote.content ? JSON.parse(dbNote.content) : [];
        return {
          ...baseNote,
          type: 'checklist' as const,
          items: Array.isArray(items) ? items.map((item: any, index: number) => ({
            id: item.id || index + 1,
            text: typeof item === 'string' ? item : (item.text || ''),
            checked: typeof item === 'object' && 'checked' in item ? item.checked : false
          })) : []
        };
      } catch (e) {
        console.error('Error parsing checklist items:', e);
        return {
          ...baseNote,
          type: 'checklist' as const,
          items: []
        };
      }
    case 'task':
      // Parse task data from JSON content
      let taskDescription = '';
      let taskPriority: 'low' | 'medium' | 'high' = 'medium';
      let taskDueDate = 'No due date';
      try {
        const parsed = JSON.parse(dbNote.content || '{}');
        taskDescription = parsed.description || '';
        taskPriority = parsed.priority || 'medium';
        taskDueDate = parsed.dueDate || 'No due date';
      } catch (e) {
        // Fallback for legacy data stored as plain text
        taskDescription = dbNote.content || '';
      }
      return {
        ...baseNote,
        type: 'task' as const,
        priority: taskPriority,
        status: (dbNote.status as "todo" | "in-progress" | "done") || 'todo',
        dueDate: taskDueDate,
        description: taskDescription
      };
    case 'article':
      // Parse article data from JSON content
      let articleContent = '';
      let articleTags: string[] = [];
      try {
        const parsed = JSON.parse(dbNote.content || '{}');
        articleContent = parsed.content || '';
        articleTags = parsed.tags || [];
      } catch (e) {
        // Fallback for legacy data stored as plain text
        articleContent = dbNote.content || '';
        articleTags = [];
      }
      return {
        ...baseNote,
        type: 'article' as const,
        content: articleContent,
        readTime: `${Math.max(1, Math.ceil(articleContent.trim().split(/\s+/).length / 200))} min read`,
        tags: articleTags
      };
    default: // Standard note
      return {
        ...baseNote,
        type: 'note' as const,
        content: dbNote.content || ''
      };
  }
};

// Convert frontend note to DB format
export const convertFrontendNoteToDb = (frontendNote: any): Omit<NoteData, 'id' | 'created_at' | 'updated_at'> => {
  let content = '';
  
  // Convert frontend note format to database format
  switch (frontendNote.type) {
    case 'checklist':
      content = JSON.stringify(frontendNote.items || []);
      break;
    case 'task':
      // Store task data as JSON
      const taskData = {
        description: frontendNote.description || '',
        priority: frontendNote.priority || 'medium',
        dueDate: frontendNote.dueDate || 'No due date'
      };
      content = JSON.stringify(taskData);
      break;
    case 'article':
      // Store content and tags as JSON in content field
      const articleData = {
        content: frontendNote.content || '',
        tags: frontendNote.tags || []
      };
      content = JSON.stringify(articleData);
      break;
    default: // Standard note
      content = frontendNote.content || '';
  }
  
  return {
    title: frontendNote.title,
    content,
    type: frontendNote.type,
    color: frontendNote.color || '#ffffff',
    status: frontendNote.status || 'active'
  };
};