import express from 'express';
import https from 'https';

const router = express.Router();

const FILE_ID = '16PG_iKxfZuEM-L2JW6ihcH0QuQrGmH7e';
const FILE_NAME = 'traxale-app.apk';

function makeRequest(
  url: string,
  res: express.Response,
  cookies: string[] = [],
  redirects = 0
) {
  if (redirects > 10) {
    return res.status(500).json({
      success: false,
      message: 'Too many Google Drive redirects',
    });
  }

  const parsed = new URL(url);

  const req = https.get(
    {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ...(cookies.length
          ? { Cookie: cookies.join('; ') }
          : {}),
      },
    },
    (driveRes) => {
      console.log(
        '[Drive]',
        driveRes.statusCode,
        driveRes.headers['content-type'],
        driveRes.headers['content-length']
      );

      // Save cookies
      const setCookies = driveRes.headers['set-cookie'];

      if (setCookies) {
        for (const cookie of setCookies) {
          const cookieValue = cookie.split(';')[0];

          if (!cookies.some((c) => c.startsWith(cookieValue.split('=')[0] + '='))) {
            cookies.push(cookieValue);
          }
        }
      }

      // Follow redirects
      if (
        [301, 302, 303, 307, 308].includes(
          driveRes.statusCode || 0
        ) &&
        driveRes.headers.location
      ) {
        driveRes.resume();

        const nextUrl = new URL(
          driveRes.headers.location,
          url
        ).toString();

        return makeRequest(
          nextUrl,
          res,
          cookies,
          redirects + 1
        );
      }

      const contentType =
        String(
          driveRes.headers['content-type'] || ''
        ).toLowerCase();

      // APK response
      if (
        contentType.includes(
          'application/octet-stream'
        ) ||
        contentType.includes(
          'application/vnd.android.package-archive'
        )
      ) {
        res.status(200);

        res.setHeader(
          'Content-Type',
          'application/vnd.android.package-archive'
        );

        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${FILE_NAME}"`
        );

        res.setHeader(
          'Cache-Control',
          'no-store'
        );

        res.setHeader(
          'X-Content-Type-Options',
          'nosniff'
        );

        if (driveRes.headers['content-length']) {
          res.setHeader(
            'Content-Length',
            driveRes.headers['content-length']
          );
        }

        return driveRes.pipe(res);
      }

      // HTML confirmation page
      if (contentType.includes('text/html')) {
        const chunks: Buffer[] = [];

        driveRes.on('data', (chunk) => {
          chunks.push(Buffer.from(chunk));
        });

        driveRes.on('end', () => {
          const html = Buffer.concat(chunks).toString('utf8');

          console.log(
            '[Drive] Confirmation HTML received:',
            html.length
          );

          /*
           * Google Drive confirmation token
           */

          let confirmToken: string | null = null;

          const patterns = [
            /confirm=([0-9A-Za-z_-]+)/,
            /name="confirm"\s+value="([^"]+)"/,
            /name="confirm"\s*value="([^"]+)"/,
            /confirm%3D([0-9A-Za-z_-]+)/,
          ];

          for (const pattern of patterns) {
            const match = html.match(pattern);

            if (match) {
              confirmToken = match[1];
              break;
            }
          }

          if (confirmToken) {
            console.log(
              '[Drive] Confirmation token:',
              confirmToken
            );

            const confirmUrl =
              `https://drive.usercontent.google.com/download` +
              `?id=${FILE_ID}` +
              `&export=download` +
              `&confirm=${encodeURIComponent(confirmToken)}`;

            return makeRequest(
              confirmUrl,
              res,
              cookies,
              redirects + 1
            );
          }

          /*
           * New Google Drive flow sometimes contains
           * a direct download URL in the HTML.
           */

          const downloadMatch = html.match(
            /https:\/\/drive\.usercontent\.google\.com\/download[^"'\\]+/
          );

          if (downloadMatch) {
            const directUrl =
              downloadMatch[0]
                .replace(/&amp;/g, '&')
                .replace(/\\u003d/g, '=')
                .replace(/\\u0026/g, '&');

            console.log(
              '[Drive] Direct URL found'
            );

            return makeRequest(
              directUrl,
              res,
              cookies,
              redirects + 1
            );
          }

          console.log(
            '[Drive] Could not find confirmation token'
          );

          console.log(
            html.substring(0, 2000)
          );

          return res.status(502).json({
            success: false,
            message:
              'Google Drive confirmation token could not be extracted',
          });
        });

        return;
      }

      driveRes.resume();

      return res.status(502).json({
        success: false,
        message:
          'Google Drive returned an unexpected response',
      });
    }
  );

  req.on('error', (error) => {
    console.error(
      '[Drive] Request error:',
      error
    );

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Google Drive download failed',
      });
    }
  });
}

router.get('/app', (_req, res) => {
  const url =
    `https://drive.google.com/uc` +
    `?export=download` +
    `&id=${FILE_ID}` +
    `&confirm=t`;

  console.log(
    '[Download] Starting Google Drive download'
  );

  makeRequest(url, res);
});

export default router;