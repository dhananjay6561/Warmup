import React, { useState } from 'react';
import { Card, Button, Input, cn } from '../components';

interface DSAQuestion {
  id: number;
  question: string;
  topic: string;
  done: boolean;
}

const topics = [
  'Arrays',
  'Strings',
  'Linked List',
  'Trees',
  'Graphs',
  'DP',
  'Math',
  'Other',
];

// Create a simple store for DSA data persistence
class DSAStore {
  private static instance: DSAStore;
  private questions: DSAQuestion[] = [];
  private listeners: Set<() => void> = new Set();
  private readonly storageKey = 'dsa-sheet-questions';

  static getInstance() {
    if (!DSAStore.instance) {
      DSAStore.instance = new DSAStore();
      DSAStore.instance.loadFromStorage();
    }
    return DSAStore.instance;
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.questions = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load DSA questions from localStorage:', error);
      this.questions = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.questions));
    } catch (error) {
      console.warn('Failed to save DSA questions to localStorage:', error);
    }
  }

  getQuestions() {
    return this.questions;
  }

  setQuestions(questions: DSAQuestion[]) {
    this.questions = questions;
    this.saveToStorage();
    this.notifyListeners();
  }

  addQuestion(question: Omit<DSAQuestion, 'id'>) {
    const newQuestion = {
      ...question,
      id: Date.now(),
    };
    this.questions = [...this.questions, newQuestion];
    this.saveToStorage();
    this.notifyListeners();
  }

  updateQuestion(id: number, updates: Partial<DSAQuestion>) {
    this.questions = this.questions.map(q => 
      q.id === id ? { ...q, ...updates } : q
    );
    this.saveToStorage();
    this.notifyListeners();
  }

  deleteQuestion(id: number) {
    this.questions = this.questions.filter(q => q.id !== id);
    this.saveToStorage();
    this.notifyListeners();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

// Custom hook to use the DSA store
const useDSAStore = () => {
  const store = DSAStore.getInstance();
  const [, forceUpdate] = useState({});
  
  React.useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      forceUpdate({});
    });
    return () => {
      unsubscribe();
    };
  }, [store]);

  return {
    questions: store.getQuestions(),
    addQuestion: (question: Omit<DSAQuestion, 'id'>) => store.addQuestion(question),
    updateQuestion: (id: number, updates: Partial<DSAQuestion>) => store.updateQuestion(id, updates),
    deleteQuestion: (id: number) => store.deleteQuestion(id),
  };
};

const DSASheet: React.FC = () => {
  const { questions, addQuestion, updateQuestion, deleteQuestion } = useDSAStore();
  const [newQuestion, setNewQuestion] = useState('');
  const [newTopic, setNewTopic] = useState(topics[0]);

  const handleAdd = () => {
    if (!newQuestion.trim()) return;
    addQuestion({
      question: newQuestion,
      topic: newTopic,
      done: false,
    });
    setNewQuestion('');
  };

  const handleToggle = (id: number) => {
    const question = questions.find(q => q.id === id);
    if (question) {
      updateQuestion(id, { done: !question.done });
    }
  };

  const handleDelete = (id: number) => {
    deleteQuestion(id);
  };

  const total = questions.length;
  const completed = questions.filter((q: DSAQuestion) => q.done).length;
  const progress = total ? (completed / total) * 100 : 0;

  return (
    <div className="w-full px-0 md:px-2">
      <div className="max-w-5xl mx-auto w-full">
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground mb-6 mt-2 px-2">DSA Sheet</h2>
        
        {/* Progress Bar */}
        <Card className="mb-6 p-6 flex flex-col gap-2">
          <div className="w-full bg-accent/40 rounded-full h-4 overflow-hidden">
            <div
              className="bg-success h-4 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-xs text-muted-foreground mt-1">{completed} / {total} completed ({Math.round(progress)}%)</div>
        </Card>
        
        {/* Add Question */}
        <Card className="mb-8 p-6 flex flex-col md:flex-row gap-3 items-center">
          <Input
            className="flex-1"
            placeholder="Add DSA question..."
            value={newQuestion}
            onChange={e => setNewQuestion(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            maxLength={120}
          />
          
          {/* Styled Select Dropdown */}
          <div className="relative w-full md:w-auto min-w-[140px]">
            <select
              className="w-full appearance-none bg-card/80 backdrop-blur-sm border border-border/60 rounded-lg px-4 py-2.5 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none transition-all hover:bg-card/90 hover:border-border cursor-pointer pr-10"
              value={newTopic}
              onChange={e => setNewTopic(e.target.value)}
            >
              {topics.map(topic => (
                <option key={topic} value={topic} className="bg-card text-foreground">
                  {topic}
                </option>
              ))}
            </select>
            {/* Custom dropdown arrow */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          <Button 
            onClick={handleAdd} 
            disabled={!newQuestion.trim()} 
            className="w-full md:w-auto min-w-[80px]"
          >
            Add
          </Button>
        </Card>
        
        {/* List by Topic */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {topics.map(topic => {
            const topicQuestions = questions.filter((q: DSAQuestion) => q.topic === topic);
            const topicCompleted = topicQuestions.filter(q => q.done).length;
            const topicProgress = topicQuestions.length > 0 ? (topicCompleted / topicQuestions.length) * 100 : 0;
            
            return (
              <Card key={topic} className="p-6 flex flex-col gap-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg text-foreground/90">{topic}</h3>
                  {topicQuestions.length > 0 && (
                    <span className="text-xs text-muted-foreground bg-accent/40 px-2 py-1 rounded-full">
                      {topicCompleted}/{topicQuestions.length}
                    </span>
                  )}
                </div>
                
                {topicQuestions.length > 0 && (
                  <div className="w-full bg-accent/20 rounded-full h-1.5 mb-3">
                    <div
                      className="bg-success h-1.5 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${topicProgress}%` }}
                    ></div>
                  </div>
                )}
                
                <ul className="space-y-2">
                  {topicQuestions.length === 0 ? (
                    <li className="text-muted-foreground italic text-sm py-2">No questions added yet</li>
                  ) : (
                    topicQuestions.map((q: DSAQuestion) => (
                      <li key={q.id} className="flex items-center gap-3 group bg-accent/10 hover:bg-accent/20 p-2 rounded-lg transition-all">
                        <input
                          type="checkbox"
                          checked={q.done}
                          onChange={() => handleToggle(q.id)}
                          className="accent-success size-4 rounded border border-accent/60 transition-all hover:scale-105"
                        />
                        <span className={cn(
                          'flex-1 text-sm transition-all',
                          q.done && 'line-through text-muted-foreground/60'
                        )}>
                          {q.question}
                        </span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDelete(q.id)} 
                          className="text-danger hover:text-danger hover:bg-danger/10 px-2 py-1 opacity-0 group-hover:opacity-100 transition-all text-xs"
                        >
                          Delete
                        </Button>
                      </li>
                    ))
                  )}
                </ul>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DSASheet;