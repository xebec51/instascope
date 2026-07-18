import { useRef } from 'react';

import { RESULT_CATEGORIES } from '../category-config';
import type { AnalysisCounts, ResultCategory } from '../types';

type ResultTabsProps = {
  activeCategory: ResultCategory;
  counts: AnalysisCounts;
  onChange: (category: ResultCategory) => void;
};

function getCount(counts: AnalysisCounts, category: ResultCategory): number {
  switch (category) {
    case 'mutual':
      return counts.mutual;
    case 'notFollowingBack':
      return counts.notFollowingBack;
    case 'notFollowedBackByUser':
      return counts.notFollowedBackByUser;
  }
}

export function ResultTabs({ activeCategory, counts, onChange }: ResultTabsProps) {
  const tabRefs = useRef(new Map<ResultCategory, HTMLButtonElement>());

  function focusTab(category: ResultCategory): void {
    tabRefs.current.get(category)?.focus();
  }

  function moveTab(direction: 1 | -1): void {
    const currentIndex = RESULT_CATEGORIES.findIndex((category) => category.id === activeCategory);
    const nextIndex = (currentIndex + direction + RESULT_CATEGORIES.length) % RESULT_CATEGORIES.length;
    const nextCategory = RESULT_CATEGORIES[nextIndex]?.id ?? 'mutual';
    onChange(nextCategory);
    window.requestAnimationFrame(() => {
      focusTab(nextCategory);
    });
  }

  return (
    <div className="result-tabs" role="tablist" aria-label="Result categories">
      {RESULT_CATEGORIES.map((category) => {
        const count = getCount(counts, category.id);
        const selected = activeCategory === category.id;

        return (
          <button
            key={category.id}
            ref={(node) => {
              if (node) {
                tabRefs.current.set(category.id, node);
              } else {
                tabRefs.current.delete(category.id);
              }
            }}
            type="button"
            role="tab"
            id={`${category.id}-tab`}
            aria-controls={`${category.id}-panel`}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className="result-tab"
            onClick={() => {
              onChange(category.id);
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                event.preventDefault();
                moveTab(1);
              }
              if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                event.preventDefault();
                moveTab(-1);
              }
              if (event.key === 'Home') {
                event.preventDefault();
                onChange(RESULT_CATEGORIES[0]?.id ?? 'mutual');
              }
              if (event.key === 'End') {
                event.preventDefault();
                onChange(RESULT_CATEGORIES.at(-1)?.id ?? 'mutual');
              }
            }}
          >
            <span>{category.label}</span>
            <span
              className="tab-count"
              aria-label={`${count.toLocaleString('en-US')} ${category.countLabel}`}
            >
              {count.toLocaleString('en-US')}
            </span>
          </button>
        );
      })}
    </div>
  );
}
