import { useCallback } from 'react'
import { useWeb3React, UnsupportedChainIdError } from '@web3-react/core'
import { NoBscProviderError } from '@binance-chain/bsc-connector'
import {
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected,
} from '@web3-react/injected-connector'
import {
  UserRejectedRequestError as UserRejectedRequestErrorWalletConnect,
  WalletConnectConnector,
} from '@web3-react/walletconnect-connector'
import { connectorsByName } from 'utils/web3React'
import { setupNetwork } from 'utils/wallet'
import { profileClear } from 'state/profile'
import { useAppDispatch } from 'state'

const useAuth = () => {
  const dispatch = useAppDispatch()
  const { activate, deactivate } = useWeb3React()

  const login = useCallback(
    (connectorID: string) => {
      const connector = connectorsByName[connectorID]
      console.log("login", connectorID, connector)
      if (connector) {
        activate(connector, async (error: Error) => {
          if (error instanceof UnsupportedChainIdError) {
            const hasSetup = await setupNetwork()
            if (hasSetup) {
              activate(connector)
            }
          } else {
            //window.localStorage.removeItem(connectorLocalStorageKey)
            if (error instanceof NoEthereumProviderError || error instanceof NoBscProviderError) {
              //toastError(t('Provider Error'), t('No provider was found'))
            } else if (
              error instanceof UserRejectedRequestErrorInjected ||
              error instanceof UserRejectedRequestErrorWalletConnect
            ) {
              if (connector instanceof WalletConnectConnector) {
                const walletConnector = connector as WalletConnectConnector
                walletConnector.walletConnectProvider = null
              }
              //toastError(t('Authorization Error'), t('Please authorize to access your account'))
            } else {
              //toastError(error.name, error.message)
            }
          }
        })
      } else {
        //toastError(t('Unable to find connector'), t('The connector config is wrong'))
      }
    },
    [activate],
  )

  const logout = useCallback(() => {
    dispatch(profileClear())
    deactivate()
    // This localStorage key is set by @web3-react/walletconnect-connector
    if (window.localStorage.getItem('walletconnect')) {
      connectorsByName.walletconnect.close()
      connectorsByName.walletconnect.walletConnectProvider = null
    }
  }, [deactivate, dispatch])

  return { login, logout }
}

export default useAuth
