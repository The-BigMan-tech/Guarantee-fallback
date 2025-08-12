import { describe, it, expect, vi } from 'vitest';
import { Text } from '@src/main.ts';

describe('Text', () => {
	it('prints a string', () => {
		const text = new Text();
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => null);
		
		text.print('Hello test');
		
		expect(logSpy).toHaveBeenCalledWith('Hello test');
		
		logSpy.mockRestore();
	});
});