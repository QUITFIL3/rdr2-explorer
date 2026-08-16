# Makes the baked-in gray background RGB(148,138,138) of the downloaded texture
# samples transparent, in place. Flood-fills from the image borders only, so
# full-bleed images (swatches, cards, startup art content) are left intact,
# then unmixes the 1px antialiased fringe around removed areas.
# Usage: powershell -File scripts/remove-image-backgrounds.ps1
# Re-runnable; already-processed images have transparent borders and are skipped.

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public static class BgRemover
{
    const int BgR = 148, BgG = 138, BgB = 138;
    const int TolExact = 4;   // flood-fill match threshold
    const int TolEdge = 60;   // antialiased fringe unmix threshold

    static int Diff(byte r, byte g, byte b)
    {
        int dr = Math.Abs(r - BgR), dg = Math.Abs(g - BgG), db = Math.Abs(b - BgB);
        return Math.Max(dr, Math.Max(dg, db));
    }

    static byte ClampB(double v)
    {
        if (v < 0) return 0;
        if (v > 255) return 255;
        return (byte)Math.Round(v);
    }

    static void Seed(byte[] p, int stride, int w, int x, int y, bool[] removed, Queue<int> q)
    {
        int i = y * w + x;
        if (removed[i]) return;
        int o = y * stride + x * 4;
        if (p[o + 3] == 0) return;
        if (Diff(p[o + 2], p[o + 1], p[o]) > TolExact) return;
        removed[i] = true;
        q.Enqueue(i);
    }

    // returns 1 if the file was modified, 0 if left untouched
    // (named Run, not Process: PowerShell's dynamic binder fails on static methods named Process)
    public static int Run(string path)
    {
        byte[] fileBytes = File.ReadAllBytes(path);
        int w, h, stride;
        byte[] p;
        Bitmap b32;
        using (MemoryStream ms = new MemoryStream(fileBytes))
        using (Bitmap orig = new Bitmap(ms))
        {
            w = orig.Width; h = orig.Height;
            b32 = orig.Clone(new Rectangle(0, 0, w, h), PixelFormat.Format32bppArgb);
        }
        BitmapData bd = b32.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        stride = bd.Stride;
        p = new byte[stride * h];
        Marshal.Copy(bd.Scan0, p, 0, p.Length);

        bool[] removed = new bool[w * h];
        Queue<int> q = new Queue<int>();
        for (int x = 0; x < w; x++) { Seed(p, stride, w, x, 0, removed, q); Seed(p, stride, w, x, h - 1, removed, q); }
        for (int y = 0; y < h; y++) { Seed(p, stride, w, 0, y, removed, q); Seed(p, stride, w, w - 1, y, removed, q); }

        int count = 0;
        int[] dx = { 1, -1, 0, 0 };
        int[] dy = { 0, 0, 1, -1 };
        while (q.Count > 0)
        {
            int idx = q.Dequeue();
            int x = idx % w, y = idx / w;
            count++;
            for (int k = 0; k < 4; k++)
            {
                int nx = x + dx[k], ny = y + dy[k];
                if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
                Seed(p, stride, w, nx, ny, removed, q);
            }
        }
        if (count == 0) { b32.UnlockBits(bd); b32.Dispose(); return 0; }

        for (int y = 0; y < h; y++)
            for (int x = 0; x < w; x++)
                if (removed[y * w + x])
                {
                    int o = y * stride + x * 4;
                    p[o] = 0; p[o + 1] = 0; p[o + 2] = 0; p[o + 3] = 0;
                }

        // fringe: near-bg pixels touching a removed pixel get unmixed + faded
        int[] dx8 = { 1, -1, 0, 0, 1, 1, -1, -1 };
        int[] dy8 = { 0, 0, 1, -1, 1, -1, 1, -1 };
        for (int y = 0; y < h; y++)
            for (int x = 0; x < w; x++)
            {
                int i = y * w + x;
                if (removed[i]) continue;
                int o = y * stride + x * 4;
                if (p[o + 3] == 0) continue;
                int d = Diff(p[o + 2], p[o + 1], p[o]);
                if (d > TolEdge) continue;
                bool adj = false;
                for (int k = 0; k < 8 && !adj; k++)
                {
                    int nx = x + dx8[k], ny = y + dy8[k];
                    if (nx >= 0 && ny >= 0 && nx < w && ny < h && removed[ny * w + nx]) adj = true;
                }
                if (!adj) continue;
                double a = (double)(d - TolExact) / (TolEdge - TolExact);
                if (a > 1) continue;
                if (a < 0.05) a = 0.05;
                p[o + 2] = ClampB((p[o + 2] - (1 - a) * BgR) / a);
                p[o + 1] = ClampB((p[o + 1] - (1 - a) * BgG) / a);
                p[o] = ClampB((p[o] - (1 - a) * BgB) / a);
                p[o + 3] = (byte)Math.Round(a * p[o + 3]);
            }

        Marshal.Copy(p, 0, bd.Scan0, p.Length);
        b32.UnlockBits(bd);
        using (MemoryStream outMs = new MemoryStream())
        {
            b32.Save(outMs, ImageFormat.Png);
            File.WriteAllBytes(path, outMs.ToArray());
        }
        b32.Dispose();
        return 1;
    }
}
'@

$root = Join-Path (Split-Path $PSScriptRoot -Parent) 'public\images\samples'
$files = Get-ChildItem $root -Filter *.png -Recurse -File
$total = $files.Count
$modified = 0
$errors = 0
$i = 0
foreach ($f in $files) {
    $i++
    try {
        if ([BgRemover]::Run($f.FullName) -eq 1) { $modified++ }
    } catch {
        $errors++
        Write-Output ("ERROR {0}: {1}" -f $f.FullName, $_.Exception.Message)
    }
    if ($i % 500 -eq 0) { Write-Output ("{0}/{1} processed, {2} modified" -f $i, $total, $modified) }
}
Write-Output ("done: {0} files, {1} modified, {2} untouched, {3} errors" -f $total, $modified, ($total - $modified - $errors), $errors)
