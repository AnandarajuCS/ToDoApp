import React from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TodoApp } from './components/TodoApp';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <div className="App">
        <TodoApp />
      </div>
    </ErrorBoundary>
  );
}

export default App;