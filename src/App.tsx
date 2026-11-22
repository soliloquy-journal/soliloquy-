/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppShell } from './components/AppShell';
import { CheckInModal } from './components/CheckInModal';
import { CustomTagsModal } from './components/CustomTagsModal';
import { NoteEditor } from './components/editor/NoteEditor';
import { JournalView } from './components/JournalView';
import { PatternsView } from './components/PatternsView';
import { PrivacyIntroModal } from './components/PrivacyIntroModal';
import { SelectionHighlightOverlay } from './components/SelectionHighlightOverlay';
import { SettingsView } from './components/SettingsView';
import { StatsView } from './components/StatsView';
import { TodayView } from './components/TodayView';
import { JournalProvider, useJournal } from './context/JournalContext';

const MainRouter: React.FC = () => {
  const { activeTab, isLoading } = useJournal();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF5E8] dark:bg-[#121215] text-[#111111] dark:text-zinc-100 flex items-center justify-center">
        <div className="tactile-card px-6 py-4 font-display font-semibold text-base">
          Opening your notebook...
        </div>
      </div>
    );
  }

  return (
    <>
      <SelectionHighlightOverlay />
      <AppShell>
        {activeTab === 'journal' && <JournalView />}
        {activeTab === 'today' && <TodayView />}
        {activeTab === 'stats' && <StatsView />}
        {activeTab === 'patterns' && <PatternsView />}
        {activeTab === 'settings' && <SettingsView />}

        <CheckInModal />
        <NoteEditor />
        <CustomTagsModal />
        <PrivacyIntroModal />
      </AppShell>
    </>
  );
};

export default function App() {
  return (
    <JournalProvider>
      <MainRouter />
    </JournalProvider>
  );
}
