import { useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';

import { BACKEND_STATE_UPDATE, BackendStateUpdateEvent } from '@app/types/backend-state.ts';

import { handleNewBlock } from '@app/store/useBlockchainVisualisationStore';
import {
    handleBaseNodeStatusUpdate,
    handleConnectedPeersUpdate,
    setCpuMiningStatus,
    setGpuDevices,
    setGpuMiningStatus,
    setPoolStatus,
} from '@app/store/actions/miningMetricsStoreActions';
import {
    handleAskForRestart,
    handleCloseSplashscreen,
    handleConnectionStatusChanged,
    setConnectionStatus,
    setShowExternalDependenciesDialog,
} from '@app/store/actions/uiStoreActions';
import { setAvailableEngines } from '@app/store/actions/miningStoreActions';
import {
    handleRestartingPhases,
    handleShowRelesaeNotes,
    loadExternalDependencies,
    handleCriticalProblemEvent,
    setCriticalError,
    setIsStuckOnOrphanChain,
    setNetworkStatus,
} from '@app/store/actions/appStateStoreActions';
import { refreshTransactions, setWalletBalance, updateWalletScanningProgress } from '@app/store';
import { deepEqual } from '@app/utils/objectDeepEqual.ts';
import {
    handleAppUnlocked,
    handleCpuMiningLocked,
    handleCpuMiningUnlocked,
    handleGpuMiningLocked,
    handleGpuMiningUnlocked,
    handleHardwarePhaseFinished,
    handleUpdateDisabledPhases,
    handleWalletLocked,
    handleWalletUnlocked,
    handleWalletUpdate,
    setInitialSetupFinished,
} from '@app/store/actions/setupStoreActions';
import { setBackgroundNodeState, setNodeStoreState } from '@app/store/useNodeStore';
import {
    handleAppInMemoryConfigChanged,
    handleConfigCoreLoaded,
    handleConfigMiningLoaded,
    handleConfigUILoaded,
    handleConfigWalletLoaded,
    handleUniversalMinerInitializedExchangeIdChanged,
    handleMiningTimeUpdate,
} from '@app/store/actions/appConfigStoreActions';
import { invoke } from '@tauri-apps/api/core';
import { handleShowStagedSecurityModal } from '@app/store/actions/stagedSecurityActions';

const LOG_EVENT_TYPES = ['WalletAddressUpdate', 'CriticalProblem', 'MissingApplications'];

const useTauriEventsListener = () => {
    const eventRef = useRef<BackendStateUpdateEvent | null>(null);
    function handleLogUpdate(newEvent: BackendStateUpdateEvent) {
        if (LOG_EVENT_TYPES.includes(newEvent.event_type)) {
            const isEqual = deepEqual(eventRef.current, newEvent);
            if (!isEqual) {
                console.info(newEvent.event_type, newEvent.payload);
                eventRef.current = newEvent;
            }
        }
    }

    useEffect(() => {
        const setupListener = async () => {
            // Set up the event listener
            const unlisten = await listen(
                BACKEND_STATE_UPDATE,
                async ({ payload: event }: { payload: BackendStateUpdateEvent }) => {
                    handleLogUpdate(event);
                    switch (event.event_type) {
                        case 'CorePhaseFinished':
                            break;
                        case 'HardwarePhaseFinished':
                            await handleHardwarePhaseFinished();
                            break;
                        case 'NodePhaseFinished':
                            break;
                        case 'MiningPhaseFinished':
                            break;
                        case 'WalletPhaseFinished':
                            break;
                        case 'InitialSetupFinished':
                            setInitialSetupFinished(true);
                            break;
                        case 'UnlockApp':
                            await handleAppUnlocked();
                            break;
                        case 'UnlockWallet':
                            handleWalletUnlocked();
                            break;
                        case 'UnlockCpuMining':
                            await handleCpuMiningUnlocked();
                            break;
                        case 'UnlockGpuMining':
                            await handleGpuMiningUnlocked();
                            break;
                        case 'LockCpuMining':
                            await handleCpuMiningLocked();
                            break;
                        case 'LockGpuMining':
                            await handleGpuMiningLocked();
                            break;
                        case 'LockWallet':
                            handleWalletLocked();
                            break;
                        case 'WalletAddressUpdate': {
                            await handleWalletUpdate(event.payload);
                            break;
                        }
                        case 'WalletBalanceUpdate':
                            await refreshTransactions();
                            await setWalletBalance(event.payload);
                            break;
                        case 'BaseNodeUpdate':
                            handleBaseNodeStatusUpdate(event.payload);
                            break;
                        case 'GpuMiningUpdate':
                            setGpuMiningStatus(event.payload);
                            break;
                        case 'CpuMiningUpdate':
                            setCpuMiningStatus(event.payload);
                            break;
                        case 'PoolStatusUpdate':
                            setPoolStatus(event.payload);
                            break;
                        case 'ConnectedPeersUpdate':
                            handleConnectedPeersUpdate(event.payload);
                            break;
                        case 'NewBlockHeight':
                            await handleNewBlock(event.payload);
                            break;
                        case 'ConfigCoreLoaded':
                            handleConfigCoreLoaded(event.payload);
                            break;
                        case 'ConfigWalletLoaded':
                            handleConfigWalletLoaded(event.payload);
                            break;
                        case 'ConfigMiningLoaded':
                            handleConfigMiningLoaded(event.payload);
                            break;
                        case 'ConfigUILoaded':
                            await handleConfigUILoaded(event.payload);
                            break;
                        case 'CloseSplashscreen':
                            handleCloseSplashscreen();
                            break;
                        case 'DetectedDevices':
                            setGpuDevices(event.payload.devices);
                            break;
                        case 'DetectedAvailableGpuEngines':
                            setAvailableEngines(event.payload.engines, event.payload.selected_engine);
                            break;
                        case 'CriticalProblem': {
                            const isMacAppFolderError =
                                event.payload.title === 'common:installation-problem' &&
                                event.payload.description === 'common:not-installed-in-applications-directory';

                            if (isMacAppFolderError) {
                                setCriticalError(event.payload);
                            } else {
                                handleCriticalProblemEvent(event.payload);
                            }
                            break;
                        }
                        case 'MissingApplications':
                            loadExternalDependencies(event.payload);
                            setShowExternalDependenciesDialog(true);
                            break;
                        case 'StuckOnOrphanChain':
                            setIsStuckOnOrphanChain(event.payload);
                            if (event.payload) {
                                setConnectionStatus('disconnected');
                            }
                            break;
                        case 'ShowReleaseNotes':
                            handleShowRelesaeNotes(event.payload);
                            break;
                        case `NetworkStatus`:
                            setNetworkStatus(event.payload);
                            break;
                        case `NodeTypeUpdate`:
                            setNodeStoreState(event.payload);
                            break;
                        case 'RestartingPhases':
                            await handleRestartingPhases(event.payload);
                            break;
                        case 'AskForRestart':
                            handleAskForRestart();
                            break;
                        case 'BackgroundNodeSyncUpdate':
                            setBackgroundNodeState(event.payload);
                            break;
                        case 'InitWalletScanningProgress':
                            updateWalletScanningProgress(event.payload);
                            break;
                        case 'ConnectionStatus':
                            handleConnectionStatusChanged(event.payload);
                            break;
                        case 'ShowStageSecurityModal':
                            handleShowStagedSecurityModal();
                            break;
                        case 'MiningTime':
                            handleMiningTimeUpdate(event.payload);
                            break;
                        case 'AppInMemoryConfigChanged':
                            handleAppInMemoryConfigChanged(event.payload);
                            break;
                        case 'DisabledPhasesChanged':
                            handleUpdateDisabledPhases(event.payload);
                            break;
                        case 'UniversalMinerInitializedExchangeIdChanged':
                            handleUniversalMinerInitializedExchangeIdChanged(event.payload);
                            break;
                        default:
                            console.warn('Unknown event', JSON.stringify(event));
                            break;
                    }
                }
            );

            try {
                await invoke('frontend_ready');
                console.info('Successfully called frontend_ready');
            } catch (e) {
                console.error('Failed to call frontend_ready: ', e);
            }

            return unlisten;
        };

        let unlistenFunction: (() => void) | null = null;
        setupListener().then((unlisten) => {
            unlistenFunction = unlisten;
        });

        return () => {
            unlistenFunction?.();
        };
    }, []);
};

export default useTauriEventsListener;
