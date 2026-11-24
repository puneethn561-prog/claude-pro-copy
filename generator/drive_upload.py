"""Upload one upload-kit folder to Google Drive (OAuth refresh token, no extra packages).

  python generator/drive_upload.py "<local kit folder>" [parent_folder_id]

Env: GDRIVE_CLIENT_ID, GDRIVE_CLIENT_SECRET, GDRIVE_REFRESH_TOKEN (scope drive.file or drive),
     DRIVE_FOLDER_ID (default 1iysmlIFQfa1Ci3ilmfyqLP8cTOdTP07Z = "AI Generated Videos (claude-pro-copy)").
Missing secrets -> prints a SKIP line and exits 0 (the Actions artifact is still there).
"""
import json, mimetypes, os, sys, urllib.parse, urllib.request
from pathlib import Path

DEFAULT_FOLDER = '1iysmlIFQfa1Ci3ilmfyqLP8cTOdTP07Z'


def token():
    data = urllib.parse.urlencode({'client_id': os.environ['GDRIVE_CLIENT_ID'], 'client_secret': os.environ['GDRIVE_CLIENT_SECRET'],
                                   'refresh_token': os.environ['GDRIVE_REFRESH_TOKEN'], 'grant_type': 'refresh_token'}).encode()
    with urllib.request.urlopen('https://oauth2.googleapis.com/token', data) as r: return json.load(r)['access_token']


def api(tok, url, body=None, headers=None, method=None):
    req = urllib.request.Request(url, body, {'Authorization': f'Bearer {tok}', **(headers or {})}, method=method)
    with urllib.request.urlopen(req) as r:
        return r.headers, (json.load(r) if r.headers.get_content_type() == 'application/json' else r.read())


def mkdir(tok, name, parent):
    _, d = api(tok, 'https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id,webViewLink',
               json.dumps({'name': name, 'mimeType': 'application/vnd.google-apps.folder', 'parents': [parent]}).encode(), {'Content-Type': 'application/json'})
    return d


def upload(tok, path, parent):
    size = path.stat().st_size; mime = mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
    h, _ = api(tok, 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id,webViewLink',
               json.dumps({'name': path.name, 'parents': [parent]}).encode(),
               {'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': mime, 'X-Upload-Content-Length': str(size)})
    with open(path, 'rb') as f:
        _, d = api(tok, h['Location'], f.read(), {'Content-Type': mime, 'Content-Length': str(size)}, method='PUT')
    return d


def main():
    kit = Path(sys.argv[1]); parent = (sys.argv[2] if len(sys.argv) > 2 else '') or os.environ.get('DRIVE_FOLDER_ID') or DEFAULT_FOLDER
    if not all(os.environ.get(k) for k in ('GDRIVE_CLIENT_ID', 'GDRIVE_CLIENT_SECRET', 'GDRIVE_REFRESH_TOKEN')):
        print('SKIP Drive upload: GDRIVE_CLIENT_ID / GDRIVE_CLIENT_SECRET / GDRIVE_REFRESH_TOKEN secrets are not set (video is still in the Actions artifact).')
        return
    tok = token(); folder = mkdir(tok, kit.name, parent)
    for p in sorted(kit.iterdir()):
        if p.is_file(): d = upload(tok, p, folder['id']); print('uploaded', p.name, d.get('id'))
    print('Drive folder:', folder.get('webViewLink') or f'https://drive.google.com/drive/folders/{folder["id"]}')


if __name__ == '__main__':
    main()
