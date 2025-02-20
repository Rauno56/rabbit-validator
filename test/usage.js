import { strict as assert } from 'assert';
import { describe, it, before, after, mock } from 'node:test';

import { copy, readJSONSync } from '../src/utils.js';
import assertUsage from '../src/usage.js';

import C from '../src/config.js';

const valid = readJSONSync('./fixtures/full.json');
const usage = [
	{ vhost: '/', queue: 'defect_queue', exchange: 'defect_direct' },
	{ vhost: '/', queue: 'defect_queue', exchange: 'defect_topic' },
	{ vhost: '/', queue: 'defect_queue', exchange: 'defect_headers' },
	{ vhost: 'isolated', queue: 'defect_queue', exchange: 'isolated_defect_headers' },
];

const opts = true;

describe('asserting usage', () => {
	before(() => {
		mock.method(console, 'log', () => {});
		mock.method(console, 'warn', () => {});
		mock.method(console, 'error', () => {});
	});

	after(() => {
		mock.reset();
	});

	it('fn exists and takes an object and an array', () => {
		const def = copy(valid);
		assertUsage(def, usage, opts);
		assert.throws(() => {
			// should throw if missing arguments
			assertUsage();
		});
		assert.throws(() => {
			// should throw if missing arguments
			assertUsage(def);
		});
	});

	describe('unused resources', () => {
		it('vhosts', () => {
			const def = copy(valid);
			def.vhosts.push({
				name: 'unused_vhost',
			});
			def.vhosts.push({
				name: 'unused_vhost2',
			});
			def.vhosts.push({
				name: 'unused_vhost3',
			});

			C.unusedFailureThreshold.vhost = 0.3;
			assert.throws(() => {
				assertUsage(def, usage, opts);
			}, /High ratio of unused vhost/);
		});

		it('queues', () => {
			const def = copy(valid);
			def.queues.push({
				vhost: '/',
				name: 'unused_queue',
			});

			C.unusedFailureThreshold.queue = 0.3;
			assert.throws(() => {
				assertUsage(def, usage, opts);
			}, /High ratio of unused queue/);
		});

		it('exchanges', () => {
			const def = copy(valid);
			def.exchanges.push({
				vhost: '/',
				name: 'unused_exchange',
			});
			def.exchanges.push({
				vhost: '/',
				name: 'unused_exchange2',
			});
			def.exchanges.push({
				vhost: '/',
				name: 'unused_exchange3',
			});

			C.unusedFailureThreshold.exchange = 0.3;
			assert.throws(() => {
				assertUsage(def, usage, opts);
			}, /High ratio of unused exchange/);
		});
	});
});
