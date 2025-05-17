import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ModeratorQuestionList from './ModeratorQuestionList';

describe('ModeratorQuestionList', () => {
  const baseQuestions = [
    { id: 1, text: 'Q1', exclude_from_ai: false },
    { id: 2, text: 'Q2', exclude_from_ai: true },
  ];
  let selected, setSelected, onAction, onToggleExcludeFromAI;

  beforeEach(() => {
    selected = [];
    setSelected = jest.fn();
    onAction = jest.fn();
    onToggleExcludeFromAI = jest.fn();
  });

  it('shows empty state if no questions', () => {
    render(<ModeratorQuestionList questions={[]} selected={[]} setSelected={setSelected} onAction={onAction} onToggleExcludeFromAI={onToggleExcludeFromAI} />);
    expect(screen.getByText(/No new questions/i)).toBeInTheDocument();
  });

  it('renders questions and controls', () => {
    render(<ModeratorQuestionList questions={baseQuestions} selected={[]} setSelected={setSelected} onAction={onAction} onToggleExcludeFromAI={onToggleExcludeFromAI} />);
    expect(screen.getByText('Q1')).toBeInTheDocument();
    expect(screen.getByText('Q2')).toBeInTheDocument();
    expect(screen.getAllByText('Approve').length).toBe(2);
    expect(screen.getAllByText('Delete').length).toBe(2);
    expect(screen.getAllByText('Flag').length).toBe(2);
    expect(screen.getAllByLabelText(/select-question/).length).toBe(2);
    expect(screen.getAllByLabelText(/Exclude from AI/).length || screen.getAllByText(/Exclude from AI/).length).toBeGreaterThan(0);
  });

  it('calls onAction when approve/delete/flag clicked', () => {
    render(<ModeratorQuestionList questions={baseQuestions} selected={[]} setSelected={setSelected} onAction={onAction} onToggleExcludeFromAI={onToggleExcludeFromAI} />);
    fireEvent.click(screen.getAllByText('Approve')[0]);
    expect(onAction).toHaveBeenCalledWith(1, 'approve');
    fireEvent.click(screen.getAllByText('Delete')[1]);
    expect(onAction).toHaveBeenCalledWith(2, 'delete');
    fireEvent.click(screen.getAllByText('Flag')[0]);
    expect(onAction).toHaveBeenCalledWith(1, 'flag');
  });

  it('calls onToggleExcludeFromAI when toggled', () => {
    render(<ModeratorQuestionList questions={baseQuestions} selected={[]} setSelected={setSelected} onAction={onAction} onToggleExcludeFromAI={onToggleExcludeFromAI} />);
    const toggles = screen.getAllByRole('checkbox');
    // The first checkbox is Exclude from AI for Q1
    fireEvent.click(toggles[0]);
    expect(onToggleExcludeFromAI).toHaveBeenCalled();
  });

  it('calls setSelected when merge checkbox toggled', () => {
    render(<ModeratorQuestionList questions={baseQuestions} selected={[]} setSelected={setSelected} onAction={onAction} onToggleExcludeFromAI={onToggleExcludeFromAI} />);
    const mergeCheckboxes = screen.getAllByLabelText(/select-question/);
    fireEvent.click(mergeCheckboxes[0]);
    expect(setSelected).toHaveBeenCalled();
  });
});
