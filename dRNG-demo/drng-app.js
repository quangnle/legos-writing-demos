/**
 * dRNG Demo - Application logic
 */
(function () {
    const P = 83;
    const A = 1, B = 7;
    let ec, G, Y, x, N, T;
    let nodes = [];
    let contributors = [];
    let contributions = [];

    const drngState = {
        step1Phase: 'g', // 'g' | 'y'
        highlightIndices: [],
        contribStep: null,
        contribNodeId: null,
        contribXi: null,
        contribKi: null,
        G: null,
        Y: null
    };
    let drngSelectedIndex = -1;
    let nodeIdCounter = 0;

    window.drngState = drngState;
    window.drngSelectedIndex = -1;
    window.drngOnPointSelected = drngOnPointSelected;

    function pointIndex(P) {
        if (!P || P.x === Infinity) return -1;
        for (let i = 0; i < ec.points.length; i++) {
            const p = ec.points[i];
            if (p.x === P.x && p.y === P.y) return i;
        }
        return -1;
    }

    function drngOnPointSelected(index, point) {
        if (!ec || !point) return;
        drngSelectedIndex = index;
        window.drngSelectedIndex = index;
        drngState.highlightIndices = [index];

        if (drngState.step1Phase === 'g') {
            G = point;
            drngState.G = G;
            drngState.Y = null;
            N = getOrder(ec, G);
            document.getElementById('g-display').textContent = `(${G.x}, ${G.y})`;
            document.getElementById('order-display').textContent = String(N);
            document.getElementById('y-display').textContent = 'Not selected';
            document.getElementById('x-display').textContent = '—';
            drngState.step1Phase = 'y';
        } else if (drngState.step1Phase === 'y') {
            Y = point;
            drngState.Y = Y;
            x = discreteLog(ec, Y, G);
            document.getElementById('y-display').textContent = `(${Y.x}, ${Y.y})`;
            document.getElementById('x-display').textContent = x !== null ? String(x) : '?';
            drngState.step1Phase = null;
            updateTDisplay();
        } else if (drngState.contribStep === 'xi' && drngState.contribNodeId !== null) {
            const M_i = point;
            const x_i = discreteLog(ec, M_i, G);
            if (x_i !== null) {
                drngState.contribXi = { x_i, M_i };
                document.getElementById('xi-display').textContent = `x_i=${x_i} → M_i=(${M_i.x},${M_i.y})`;
            }
        } else if (drngState.contribStep === 'ki' && drngState.contribNodeId !== null) {
            const C_i = point;
            const k_i = discreteLog(ec, C_i, G);
            if (k_i !== null) {
                drngState.contribKi = { k_i, C_i };
                document.getElementById('ki-display').textContent = `k_i=${k_i} → C_i=(${C_i.x},${C_i.y})`;
            }
        }
    }

    function updateTDisplay() {
        if (!Y) return;
        T = computeSessionTicket(document.getElementById('nonce').value, Y, ec.p);
        const el = document.getElementById('t-display');
        if (el) el.textContent = 'Ticket T = ' + T;
    }

    function renderNodes() {
        const list = document.getElementById('nodes-list');
        list.innerHTML = nodes.map((n, i) => `
            <div class="node-item" data-id="${n.id}">
                <span>Node ${i + 1}</span>
                <span class="node-pk">PK: ${n.pk ? `(${n.pk.x},${n.pk.y})` : 'Not selected — click on curve'}</span>
                ${n.sk !== undefined ? `<span>sk=${n.sk}</span>` : ''}
                ${n.y_i !== undefined ? `<span class="${n.eligible ? 'eligible' : 'not-eligible'}">y_i=${n.y_i} ${n.eligible ? '✓ Eligible' : '✗'}</span>` : ''}
                ${n.pk ? `<button type="button" class="reselect-node" data-id="${n.id}">Reselect</button>` : ''}
                <button type="button" class="remove-node" data-id="${n.id}">Remove</button>
            </div>
        `).join('');
        list.querySelectorAll('.remove-node').forEach(btn => {
            btn.onclick = () => {
                const id = parseInt(btn.dataset.id, 10);
                nodes = nodes.filter(n => n.id !== id);
                renderNodes();
                updateContributorsFromEligible();
            };
        });
        list.querySelectorAll('.reselect-node').forEach(btn => {
            btn.onclick = () => {
                const n = nodes.find(nn => nn.id === parseInt(btn.dataset.id, 10));
                if (n) {
                    n.pk = null;
                    n.sk = null;
                    n.y_i = n.pi_i = n.eligible = undefined;
                    showNodeMsg('');
                    renderNodes();
                }
            };
        });
    }

    function renderContributors() {
        const el = document.getElementById('contributors-list');
        el.textContent = contributors.length ? 'Contributors: ' + contributors.map(c => `Node ${c.id}`).join(', ') : '';
    }

    function hasContributed(nodeId) {
        return contributions.some(c => c.nodeId === nodeId);
    }

    function renderEligibleNodesList() {
        const container = document.getElementById('eligible-nodes-items');
        if (!container) return;
        if (contributors.length === 0) {
            container.innerHTML = '<div class="contrib-placeholder" style="padding:0.75rem;font-size:0.85rem">No eligible nodes yet.<br>Run Step 2 first.</div>';
            return;
        }
        container.innerHTML = contributors.map(c => {
            const n = nodes.find(nn => nn.id === c.id);
            const idx = n ? nodes.indexOf(n) + 1 : c.id;
            const contributed = hasContributed(c.id);
            const selected = drngState.contribNodeId === c.id;
            return `<div class="contrib-node-chip ${selected ? 'selected' : ''} ${contributed ? 'contributed' : ''}" data-id="${c.id}" role="button" tabindex="0">
                <span>Node ${idx}</span>
                <span class="contrib-node-tick">${contributed ? '✓' : '·'}</span>
            </div>`;
        }).join('');
        container.querySelectorAll('.contrib-node-chip').forEach(chip => {
            chip.onclick = () => {
                const id = parseInt(chip.dataset.id, 10);
                drngState.contribNodeId = id;
                drngState.contribXi = null;
                drngState.contribKi = null;
                document.getElementById('xi-display').textContent = '—';
                document.getElementById('ki-display').textContent = '—';
                document.getElementById('contrib-no-selection').style.display = 'none';
                document.getElementById('contrib-selected').style.display = 'block';
                renderEligibleNodesList();
            };
        });
    }

    function updateContribPanelVisibility() {
        const noSel = document.getElementById('contrib-no-selection');
        const sel = document.getElementById('contrib-selected');
        if (!noSel || !sel) return;
        if (drngState.contribNodeId === null) {
            noSel.style.display = 'block';
            sel.style.display = 'none';
        } else {
            noSel.style.display = 'none';
            sel.style.display = 'block';
        }
    }

    function initDrng() {
        ec = new FiniteEC(A, B, P);
        G = null;
        Y = null;
        x = null;
        N = 0;
        drngState.G = null;
        drngState.Y = null;

        window.ec = ec;
        drngState.step1Phase = 'g';
        drngState.highlightIndices = [];
        drngSelectedIndex = -1;
        window.drngSelectedIndex = -1;
        nodes = [];
        contributors = [];
        contributions = [];

        document.getElementById('g-display').textContent = 'Not selected';
        document.getElementById('order-display').textContent = '—';
        document.getElementById('y-display').textContent = 'Not selected';
        document.getElementById('x-display').textContent = '—';

        document.getElementById('nonce').addEventListener('input', () => { if (Y) updateTDisplay(); });
        document.getElementById('tau').addEventListener('input', () => {});

        document.getElementById('btn-add-node').onclick = () => {
            nodeIdCounter++;
            nodes.push({ id: nodeIdCounter, pk: null, sk: null });
            renderNodes();
        };

        document.getElementById('btn-compute-vrf').onclick = () => {
            if (!(G && Y)) { alert('Select G and Y first.'); return; }
            const nonce = document.getElementById('nonce').value;
            const tau = parseInt(document.getElementById('tau').value, 10) || 0;
            T = computeSessionTicket(nonce, Y, ec.p);
            document.getElementById('t-display').textContent = 'T = ' + T;

            const out = [];
            nodes.forEach((n, i) => {
                if (!n.pk) {
                    out.push(`Node ${i + 1}: PK not selected — click on curve to set PK`);
                    return;
                }
                n.sk = discreteLog(ec, n.pk, G);
                if (n.sk === null) {
                    n.pk = null;
                    n.sk = null;
                    out.push(`Node ${i + 1}: sk not found (point not in subgroup of G) — reset, click again to select a point in G's subgroup`);
                    renderNodes();
                    return;
                }
                const { y_i, pi_i } = vrfProve(ec, G, N, n.sk, n.pk, nonce, T);
                n.y_i = y_i;
                n.pi_i = pi_i;
                n.eligible = y_i < tau;
                out.push(`Node ${i + 1}: y_i=${y_i}, π_i=(c=${pi_i.c},z=${pi_i.z}) — ${n.eligible ? 'Eligible ✓' : 'Not eligible'}`);
            });
            document.getElementById('poe-output').textContent = out.join('\n');
            renderNodes();
            updateContributorsFromEligible();
        };

        document.getElementById('btn-verify-poe').onclick = () => {
            if (!(G && Y)) { alert('Select G and Y first.'); return; }
            const nonce = document.getElementById('nonce').value;
            T = computeSessionTicket(nonce, Y, ec.p);
            const verified = [];
            const failed = [];
            nodes.forEach((n, i) => {
                if (!n.pi_i || !n.eligible) return;
                const ok = vrfVerify(ec, G, N, n.pk, nonce, T, n.y_i, n.pi_i);
                if (ok) {
                    verified.push(i + 1);
                } else {
                    failed.push(i + 1);
                }
            });
            contributors = verified.length
                ? nodes.filter((n, i) => n.pi_i && n.eligible && vrfVerify(ec, G, N, n.pk, nonce, T, n.y_i, n.pi_i)).map(n => ({ id: n.id, node: n }))
                : [];
            renderContributors();
            renderEligibleNodesList();

            let msg = '\n\nPoE: ';
            if (verified.length) msg += 'Verified Node ' + verified.join(', ');
            if (failed.length) msg += (verified.length ? '; ' : '') + 'Failed Node ' + failed.join(', ');
            if (!verified.length && !failed.length) msg += 'No eligible nodes to verify.';
            if (verified.length === 0 && failed.length > 0) {
                msg += ' — No verified contributors for Step 3.';
            }
            document.getElementById('poe-output').textContent += msg;
        };

        function updateContributorsFromEligible() {
            contributors = nodes.filter(n => n.pi_i && n.eligible).map(n => ({ id: n.id, node: n }));
            renderContributors();
            renderEligibleNodesList();
        }

        document.getElementById('btn-select-xi').onclick = () => {
            if (!drngState.contribNodeId) return;
            drngState.contribStep = 'xi';
            drngState.contribXi = null;
            drngState.contribKi = null;
            document.getElementById('xi-display').textContent = '—';
            document.getElementById('ki-display').textContent = '—';
        };

        document.getElementById('btn-select-ki').onclick = () => {
            if (!drngState.contribNodeId) return;
            drngState.contribStep = 'ki';
            drngState.contribKi = null;
            document.getElementById('ki-display').textContent = '—';
        };

        document.getElementById('btn-contribute').onclick = () => {
            if (!drngState.contribXi || !drngState.contribKi || !drngState.contribNodeId) {
                alert('Select node, x_i and k_i first.');
                return;
            }
            if (hasContributed(drngState.contribNodeId)) {
                alert('This node has already contributed.');
                return;
            }
            const { x_i, M_i } = drngState.contribXi;
            const { k_i, C_i } = drngState.contribKi;
            const { C, D } = elGamalEncrypt(ec, G, Y, k_i, M_i);
            contributions.push({ nodeId: drngState.contribNodeId, x_i, k_i, M_i, C, D });
            document.getElementById('contributions-output').textContent =
                (document.getElementById('contributions-output').textContent || '') +
                `Node ${drngState.contribNodeId}: C_i=(${C.x},${C.y}) D_i=(${D.x},${D.y})\n`;
            renderEligibleNodesList();
        };

        document.getElementById('btn-tally').onclick = () => {
            if (contributions.length === 0) {
                alert('At least 1 contribution required.');
                return;
            }
            const { C, D } = sumCiphertexts(ec, contributions);
            const M = elGamalDecrypt(ec, x, C, D);
            document.getElementById('tally-output').textContent =
                `C = (${C.x},${C.y})\nD = (${D.x},${D.y})\nM = D - xC = (${M.x},${M.y})`;
            document.getElementById('m-beacon').innerHTML =
                'Random Beacon M = (' + M.x + ', ' + M.y + ')';
        };

        renderNodes();
        drngState.contribNodeId = null;
        updateContribPanelVisibility();
        renderEligibleNodesList();
        if (document.querySelector('.formula-intro .katex-wrap')) {
            renderMathInElement(document.body, { delimiters: [{ left: '\\(', right: '\\)', display: false }] });
        }
    }

    // Node PK selection: when in step 2, clicking sets the *last added* node's PK
    const originalOnPointSelected = drngOnPointSelected;
    window.drngOnPointSelected = function (index, point) {
        if (drngState.step1Phase) {
            originalOnPointSelected(index, point);
            return;
        }
        if (drngState.contribStep) {
            originalOnPointSelected(index, point);
            return;
        }
        if (!G) return;
        const nodeWithoutPk = nodes.find(n => !n.pk || n.sk === null || n.sk === undefined);
        if (nodeWithoutPk) {
            const sk = discreteLog(ec, point, G);
            if (sk === null) {
                if (nodeWithoutPk.pk) nodeWithoutPk.pk = null;
                showNodeMsg('Point not in subgroup of G — select another point (only points of form kG)');
                return;
            }
            nodeWithoutPk.pk = point;
            nodeWithoutPk.sk = sk;
            showNodeMsg('');
            renderNodes();
        }
    };

    function showNodeMsg(msg) {
        let el = document.getElementById('node-msg');
        if (!el) {
            el = document.createElement('div');
            el.id = 'node-msg';
            el.className = 'node-msg';
            document.getElementById('nodes-list').parentNode.insertBefore(el, document.getElementById('nodes-list'));
        }
        el.textContent = msg;
        el.style.color = msg ? 'var(--error)' : 'transparent';
    }

    window.initDrng = initDrng;
})();
