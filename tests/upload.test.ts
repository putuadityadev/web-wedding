import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatBytes, optimizeImageForUpload } from '../lib/media/clientImageOptimizer';

describe('Media & Image Optimizer Utility', () => {
  it('formats bytes into readable string properly', () => {
    assert.equal(formatBytes(0), '0 B');
    assert.equal(formatBytes(1024), '1.0 KB');
    assert.equal(formatBytes(1024 * 1024 * 2.5), '2.5 MB');
    assert.equal(formatBytes(500), '500.0 B');
  });

  it('passes through video files without conversion', async () => {
    const fakeVideoFile = new File(['fake-video-content'], 'test.mp4', { type: 'video/mp4' });
    const res = await optimizeImageForUpload(fakeVideoFile);
    assert.equal(res.optimized, false);
    assert.equal(res.file.name, 'test.mp4');

    const fakeWebm = new File(['fake-webm-content'], 'background_cinematic.webm', { type: 'video/webm' });
    const resWebm = await optimizeImageForUpload(fakeWebm);
    assert.equal(resWebm.optimized, false);
    assert.equal(resWebm.file.name, 'background_cinematic.webm');
  });

  it('passes through audio files without conversion', async () => {
    const fakeAudioFile = new File(['fake-audio-content'], 'music.mp3', { type: 'audio/mpeg' });
    const res = await optimizeImageForUpload(fakeAudioFile);
    assert.equal(res.optimized, false);
    assert.equal(res.file.name, 'music.mp3');

    const fakeM4a = new File(['m4a-data'], 'lagu_pernikahan.m4a', { type: 'audio/m4a' });
    const resM4a = await optimizeImageForUpload(fakeM4a);
    assert.equal(resM4a.optimized, false);
    assert.equal(resM4a.file.name, 'lagu_pernikahan.m4a');
  });

  it('passes through animated gif and svg without rasterizing', async () => {
    const fakeGif = new File(['gif'], 'animation.gif', { type: 'image/gif' });
    const resGif = await optimizeImageForUpload(fakeGif);
    assert.equal(resGif.optimized, false);
    assert.equal(resGif.file.name, 'animation.gif');

    const fakeSvg = new File(['<svg></svg>'], 'logo.svg', { type: 'image/svg+xml' });
    const resSvg = await optimizeImageForUpload(fakeSvg);
    assert.equal(resSvg.optimized, false);
    assert.equal(resSvg.file.name, 'logo.svg');
  });

  it('gracefully falls back to original file if running outside browser DOM/Canvas', async () => {
    // In node/test runner, window/Image/document is not present, so it must gracefully fallback
    const fakeImg = new File(['image-bytes'], 'camera_photo.avif', { type: 'image/avif' });
    const res = await optimizeImageForUpload(fakeImg);
    assert.equal(res.file.name, 'camera_photo.avif');
  });
});
