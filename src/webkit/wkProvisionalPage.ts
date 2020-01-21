/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { WKSession } from './wkConnection';
import { WKPage } from './wkPage';
import { RegisteredListener, helper, assert } from '../helper';
import { Protocol } from './protocol';

export class WKProvisionalPage {
  readonly _session: WKSession;
  private readonly _wkPage: WKPage;
  private _sessionListeners: RegisteredListener[] = [];
  private _mainFrameId: string | null = null;

  constructor(session: WKSession, page: WKPage) {
    this._session = session;
    this._wkPage = page;

    const overrideFrameId = (handler: (p: any) => void) => {
      return (payload: any) => {
        // Pretend that the events happened in the same process.
        if (payload.frameId)
          payload.frameId = this._wkPage._page._frameManager.mainFrame()._id;
        handler(payload);
      };
    };
    const networkManager = this._wkPage._networkManager;

    this._sessionListeners = [
      helper.addEventListener(session, 'Network.requestWillBeSent', overrideFrameId(e => networkManager._onRequestWillBeSent(session, e))),
      helper.addEventListener(session, 'Network.requestIntercepted', overrideFrameId(e => networkManager._onRequestIntercepted(e))),
      helper.addEventListener(session, 'Network.responseReceived', overrideFrameId(e => networkManager._onResponseReceived(e))),
      helper.addEventListener(session, 'Network.loadingFinished', overrideFrameId(e => networkManager._onLoadingFinished(e))),
      helper.addEventListener(session, 'Network.loadingFailed', overrideFrameId(e => networkManager._onLoadingFailed(e))),
    ];


    this._wkPage._initializeSession(session, ({frameTree}) => this._handleFrameTree(frameTree));
  }

  dispose() {
    helper.removeEventListeners(this._sessionListeners);
  }

  commit() {
    assert(this._mainFrameId);
    this._wkPage._onFrameAttached(this._mainFrameId!, null);
  }

  private _handleFrameTree(frameTree: Protocol.Page.FrameResourceTree) {
    assert(!frameTree.frame.parentId);
    this._mainFrameId = frameTree.frame.id;
  }
}