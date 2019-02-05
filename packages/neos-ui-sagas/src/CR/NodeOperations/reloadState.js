import {takeLatest, put, select} from 'redux-saga/effects';
import {$get} from 'plow-js';
import backend from '@neos-project/neos-ui-backend-connector';

import {actions, actionTypes} from '@neos-project/neos-ui-redux-store';

export default function * watchReloadState({configuration}) {
    yield takeLatest(actionTypes.CR.Nodes.RELOAD_STATE, function * reloadState(action) {
        const {q} = backend.get();
        const currentSiteNodeContextPath = yield select($get('cr.nodes.siteNode'));
        const clipboardNodeContextPath = yield select($get('cr.nodes.clipboard'));
        const toggledNodes = yield select($get('ui.pageTree.toggled'));
        const siteNodeContextPath = $get('payload.siteNodeContextPath', action) || currentSiteNodeContextPath;
        const documentNodeContextPath = yield $get('payload.documentNodeContextPath', action) || select($get('ui.contentCanvas.contextPath'));
        yield put(actions.UI.PageTree.setAsLoading(currentSiteNodeContextPath));
        const nodes = yield q([siteNodeContextPath, documentNodeContextPath]).neosUiDefaultNodes(
            configuration.nodeTree.presets.default.baseNodeType,
            configuration.nodeTree.loadingDepth,
            toggledNodes.toJS(),
            clipboardNodeContextPath
        ).getForTree();
        const nodeMap = nodes.reduce((nodeMap, node) => {
            nodeMap[$get('contextPath', node)] = node;
            return nodeMap;
        }, {});
        yield put(actions.CR.Nodes.setState({
            siteNodeContextPath,
            documentNodeContextPath,
            nodes: nodeMap,
            merge: $get('payload.merge', action)
        }));
        yield put(actions.UI.PageTree.setAsLoaded(currentSiteNodeContextPath));
    });
}
