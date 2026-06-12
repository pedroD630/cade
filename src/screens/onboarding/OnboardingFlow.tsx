import React, { useState } from 'react';

import { useApp } from '../../context/AppContext';
import { DEFAULT_PHRASE } from '../../types';
import { NameStep } from './NameStep';
import { PermissionsStep } from './PermissionsStep';
import { PhraseStep } from './PhraseStep';
import { TestStep } from './TestStep';
import { WelcomeStep } from './WelcomeStep';

type Step = 'welcome' | 'name' | 'permissions' | 'phrase' | 'test';

/**
 * Fluxo de onboarding (seção 6 dos requisitos): máximo de 4 telas,
 * sem criação de conta, com fluxo alternativo "configurar para outra pessoa".
 */
export function OnboardingFlow() {
  const { updateSettings } = useApp();
  const [step, setStep] = useState<Step>('welcome');
  const [forOther, setForOther] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  const [phrase, setPhrase] = useState(DEFAULT_PHRASE);

  const finish = async () => {
    await updateSettings({
      onboardingDone: true,
      listeningEnabled: true,
      phrase: phrase.trim() || DEFAULT_PHRASE,
      ownerName: ownerName.trim() || null,
    });
  };

  switch (step) {
    case 'welcome':
      return (
        <WelcomeStep
          onConfigureForSelf={() => {
            setForOther(false);
            setStep('permissions');
          }}
          onConfigureForOther={() => {
            setForOther(true);
            setStep('name');
          }}
        />
      );
    case 'name':
      return (
        <NameStep
          name={ownerName}
          onChangeName={setOwnerName}
          onContinue={() => setStep('permissions')}
          onBack={() => setStep('welcome')}
        />
      );
    case 'permissions':
      return (
        <PermissionsStep
          onContinue={() => setStep('phrase')}
          onBack={() => setStep(forOther ? 'name' : 'welcome')}
        />
      );
    case 'phrase':
      return (
        <PhraseStep
          phrase={phrase}
          onChangePhrase={setPhrase}
          onContinue={() => setStep('test')}
          onBack={() => setStep('permissions')}
        />
      );
    case 'test':
      return (
        <TestStep
          phrase={phrase}
          ownerName={forOther ? ownerName.trim() || null : null}
          onRetry={() => {
            // O próprio TestStep reinicia a escuta; nada a fazer aqui.
          }}
          onFinish={() => {
            void finish();
          }}
          onBack={() => setStep('phrase')}
        />
      );
  }
}
