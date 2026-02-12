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
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'PUT',
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
          items: items.map((item: any, index: number) => ({
            id: index + 1,
            text: item.text || '',
            checked: item.checked || false
          }))
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
      return {
        ...baseNote,
        type: 'task' as const,
        priority: dbNote.content?.includes('high') ? 'high' : dbNote.content?.includes('medium') ? 'medium' : 'low',
        status: dbNote.status as any,
        dueDate: dbNote.content || 'No due date',
        description: dbNote.content || ''
      };
    case 'article':
      return {
        ...baseNote,
        type: 'article' as const,
        content: dbNote.content || '',
        readTime: '5 min read', // Placeholder
        tags: [] // Placeholder
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
      content = frontendNote.description || '';
      break;
    case 'article':
      content = frontendNote.content || '';
      break;
    default: // Standard note
      content = frontendNote.content || '';
  }
  
  return {
    title: frontendNote.title,
    content,
    type: frontendNote.type,
    color: frontendNote.color,
    status: frontendNote.status || 'active'
  };
};