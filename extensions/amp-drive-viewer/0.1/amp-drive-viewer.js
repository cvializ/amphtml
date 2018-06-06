/**
 * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Embeds the Google Docs viewer
 *
 * Example:
 * <code>
 * <amp-drive-viewer
 *   layout="fixed-height"
 *   src="https://www.example.com/my-document.pdf"
 *   height="600">
 * </amp-drive-viewer>
 * </code>
 */

import {addParamToUrl} from '../../../src/url';
import {isExperimentOn} from '../../../src/experiments';
import {isLayoutSizeDefined} from '../../../src/layout';
import {removeElement} from '../../../src/dom';
import {user} from '../../../src/log';

export const TAG = 'amp-drive-viewer';

const ATTRIBUTES_TO_PROPAGATE = [
  'alt',
];

const GOOGLE_DOCS_EMBED_RE = /^https?:\/\/docs\.google\.com.+\/pub.*\??/;

export class AmpDriveViewer extends AMP.BaseElement {

  /** @param {!AmpElement} element */
  constructor(element) {
    super(element);

    /** @private {?Element} */
    this.iframe_ = null;
  }

  /**
   * Prefetches and preconnects URLs related to the viewer.
   * @param {boolean=} opt_onLayout
   * @override
   */
  preconnectCallback(opt_onLayout) {
    this.preconnect.url('https://docs.google.com', opt_onLayout);
  }

  /** @override */
  renderOutsideViewport() {
    return false;
  }

  /** @override */
  isLayoutSupported(layout) {
    return isLayoutSizeDefined(layout);
  }

  /** @override */
  buildCallback() {
    user().assert(
        isExperimentOn(this.win, TAG), `Experiment ${TAG} is disabled`);
    user().assert(
        this.element.getAttribute('src'),
        'The src attribute is required for <amp-drive-viewer> %s',
        this.element);
  }

  /** @override */
  layoutCallback() {
    const iframe = this.element.ownerDocument.createElement('iframe');
    this.iframe_ = iframe;

    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', '');
    this.propagateAttributes(ATTRIBUTES_TO_PROPAGATE, iframe);

    iframe.src = this.getSrc_(this.element.getAttribute('src'));

    this.applyFillContent(iframe);
    this.element.appendChild(iframe);
    return this.loadPromise(iframe);
  }

  /**
   * Get the iframe source. Google Docs are special cased since they display
   * using their own embed URL.
   * @param {string} src
   * @return {string} A URL to display a document using the Google Drive viewer.
   */
  getSrc_(src) {
    if (src.match(GOOGLE_DOCS_EMBED_RE)) {
      return src;
    }
    return addParamToUrl(
        'https://docs.google.com/gview?embedded=true', 'url', src);
  }

  /** @override */
  unlayoutOnPause() {
    return true;
  }

  /** @override */
  unlayoutCallback() {
    if (this.iframe_) {
      removeElement(this.iframe_);
      this.iframe_ = null;
    }
    return true;
  }
}


AMP.extension('amp-drive-viewer', '0.1', AMP => {
  AMP.registerElement('amp-drive-viewer', AmpDriveViewer);
});
