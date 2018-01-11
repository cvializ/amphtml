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
'use strict';

const doctrine = require('doctrine');
const traverse = require('traverse');

/** @typedef {!Object} */
let EslintContextDef;

/** @typedef {!Object} */
let EslintNodeDef;

/**
 * @typedef {{
 *   node: !EslintNodeDef,
 *   parsed: !Object
 * }}
 */
let ClosureCommentDef;

module.exports = function(context) {
  const sourceCode = context.getSourceCode();

  return {
    meta: {
      fixable: 'code',
    },
    Program: function() {
      const comments =
          /** @type {!Array<!EslintNodeDef>} */ (sourceCode.getAllComments());
      comments
          .map(node => parseClosureComments(context, node))
          .forEach(comment => checkClosureComments(context, comment));
    },
  };
};

/**
 * Parses Closure Compiler tags into an array from the given comment.
 * @param {!EslintContextDef} context
 * @param {!EslintNodeDef} node
 * @return {?ClosureCommentDef}
 */
function parseClosureComments(context, node) {
  try {
    return {
      parsed: doctrine.parse(node.value, {recoverable: true, unwrap: true}),
      node,
    };
  } catch (e) {
    reportUnparseableNode(context, node);
    return null;
  }
}

/**
 * Report the existence of a syntax error in a closure comment.
 * @param {!EslintContextDef} context
 * @param {!EslintNodeDef} node
 */
function reportUnparseableNode(context, node) {
  context.report({
    node,
    message: 'A Closure comment syntax error was encountered.',
  });
}

/**
 * Parse a Closure Compiler comment and check if it contains a primitive
 * redundantly specified as non-nullable with a !
 * e.g. {!string}
 * @param {!EslintContextDef} context
 * @param {?ClosureCommentDef} closureComment
 */
function checkClosureComments(context, closureComment) {
  if (!closureComment) {
    return;
  }

  const {parsed, node} = closureComment;
  traverse(parsed).forEach(astNode => {
    const isNonNullableType = (astNode && astNode.type === 'NonNullableType');
    if (!isNonNullableType || !astNode.expression) {
      return;
    }

    const {type, name} = astNode.expression;
    if (type === 'NameExpression' && isNonNullablePrimitive(name)) {
      reportNonNullablePrimitive(context, node, name);
    }
  });
}

/** @enum {string} */
const NON_NULLABLE_PRIMITIVES = [
  'boolean',
  'number',
  'string',
  'symbol',
];

/**
 * True if the given name matches a primitive type
 * @param {string} name
 * @return {boolean}
 */
function isNonNullablePrimitive(name) {
  return NON_NULLABLE_PRIMITIVES.includes(name);
}

/**
 * Report the existence of a non-nullable primitive. If --fix is specified,
 * remove the offending exclamation point.
 * @param {!EslintContextDef} context
 * @param {!EslintNodeDef} node
 * @param {string} name
 */
function reportNonNullablePrimitive(context, node, name) {
  context.report({
    node,
    message: 'Redundant non-nullable primitive {{ name }}.',
    data: {name},
    fix(fixer) {
      const badText = `!${name}`;
      const badTextIndex = node.value.indexOf(badText);
      if (badTextIndex === -1) {
        return;
      }

      const start = node.range[0] + badTextIndex + 2;
      const end = start + 1;
      return fixer.removeRange([start, end]);
    },
  });
}

