import { env } from '../config/env';

export interface EmployeeWelcomeData {
  employeeName: string;
  employeeId: string;
  email: string;
  temporaryPassword: string;
  department: string;
  designation: string;
  role: string;
  managerName?: string;
  salary?: number | string;
  joiningDate: string;
  employmentType?: string;
  officeLocation?: string;
  phoneNumber?: string;
  reportingManager?: string;
  shift?: string;
  workingHours?: string;
  employeeStatus: string;
  loginUrl?: string;
  hrName?: string;
  hrEmail?: string;
}

export interface EmailTemplateOptions {
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  showFooter?: boolean;
}

const formatCurrency = (amount?: number | string): string => {
  if (!amount) return 'N/A';
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return String(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(numAmount);
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const generateBaseEmailLayout = (
  bodyContent: string,
  options: EmailTemplateOptions = {}
): string => {
  const {
    title = env.COMPANY_NAME,
    subtitle = 'Professional HR Management Solutions',
    showHeader = true,
    showFooter = true,
  } = options;

  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title}</title>
  <!--[if mso]>
  <style>
    table {border-collapse:collapse !important;}
    td, a, div, p {font-family: Arial, sans-serif !important; line-height: 100% !important;}
    .mso-fallback {display:block !important;}
  </style>
  <![endif]-->
  <style type="text/css">
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      outline: none;
      text-decoration: none;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background-color: #f0f4f8;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    * {
      -ms-transition: all 0.2s ease;
      -moz-transition: all 0.2s ease;
      -o-transition: all 0.2s ease;
      transition: all 0.2s ease;
    }
    .email-container {
      max-width: 680px;
      margin: 0 auto;
    }
    .header-gradient {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%);
    }
    .card {
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
    }
    .info-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    .info-table tr:last-child td {
      border-bottom: none;
    }
    .info-table .label-cell {
      color: #6b7280;
      font-weight: 500;
      width: 40%;
      background-color: #f9fafb;
    }
    .info-table .value-cell {
      color: #1f2937;
      font-weight: 600;
    }
    .btn-primary {
      background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
      color: #ffffff !important;
      text-decoration: none !important;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      display: inline-block;
      text-align: center;
    }
    .security-box {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-left: 4px solid #f59e0b;
      border-radius: 8px;
    }
    .login-box {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      border-left: 4px solid #3b82f6;
      border-radius: 8px;
    }
    .footer-gradient {
      background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
    }
    a:visited, a:hover, a:active {
      text-decoration: none !important;
    }
    @media only screen and (max-width: 640px) {
      .email-container { width: 100% !important; }
      .btn-primary { width: 100% !important; display: block !important; }
      .info-table td { padding: 8px 10px !important; font-size: 13px !important; }
      .mobile-padding { padding: 20px !important; }
    }
  </style>
</head>
<body>
  <div style="width:100%;background-color:#f0f4f8;padding:20px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f0f4f8;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="680" class="email-container">
            ${showHeader ? `
            <tr>
              <td class="header-gradient" style="padding:32px 40px;border-radius:16px 16px 0 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="text-align:center;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                        <tr>
                          <td style="width:56px;height:56px;background-color:rgba(255,255,255,0.15);border-radius:14px;text-align:center;vertical-align:middle;">
                            <span style="color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-1px;">T</span>
                          </td>
                          <td style="padding-left:14px;">
                            <div style="color:#ffffff;font-size:24px;font-weight:700;line-height:1.2;letter-spacing:-0.3px;">${env.COMPANY_NAME}</div>
                            <div style="color:rgba(255,255,255,0.85);font-size:13px;margin-top:2px;">${subtitle}</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ` : ''}
            <tr>
              <td style="background-color:#ffffff;padding:0;">
                ${bodyContent}
              </td>
            </tr>
            ${showFooter ? `
            <tr>
              <td class="footer-gradient" style="padding:28px 40px;border-radius:0 0 16px 16px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="text-align:center;">
                      <div style="color:#e5e7eb;font-size:15px;font-weight:600;margin-bottom:8px;">Regards,</div>
                      <div style="color:#ffffff;font-size:18px;font-weight:700;margin-bottom:16px;">The ${env.COMPANY_NAME} Team</div>
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:18px;">
                        <tr>
                          <td style="vertical-align:middle;padding:0 8px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td style="width:20px;height:20px;text-align:center;">
                                  <span style="color:#93c5fd;font-size:12px;">✉</span>
                                </td>
                                <td style="padding-left:6px;">
                                  <a href="mailto:${env.COMPANY_EMAIL}" style="color:#93c5fd;font-size:13px;text-decoration:none;">${env.COMPANY_EMAIL}</a>
                                </td>
                              </tr>
                            </table>
                          </td>
                          <td style="vertical-align:middle;padding:0 8px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td style="width:20px;height:20px;text-align:center;">
                                  <span style="color:#93c5fd;font-size:12px;">🌐</span>
                                </td>
                                <td style="padding-left:6px;">
                                  <a href="${env.COMPANY_WEBSITE}" target="_blank" style="color:#93c5fd;font-size:13px;text-decoration:none;">${env.COMPANY_WEBSITE}</a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      <div style="height:1px;background-color:rgba(255,255,255,0.12);margin:0 auto 16px auto;max-width:400px;"></div>
                      <div style="color:rgba(255,255,255,0.55);font-size:11px;line-height:1.6;">
                        This is an automated email. Please do not reply directly to this message.<br>
                        © ${new Date().getFullYear()} ${env.COMPANY_NAME}. All rights reserved.
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ` : ''}
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `;
};

export const generateEmployeeWelcomeTemplate = (data: EmployeeWelcomeData): string => {
  const loginUrl = data.loginUrl || env.LOGIN_URL;
  const companyName = env.COMPANY_NAME;

  const bodyContent = `
    <div style="padding:32px 40px;" class="mobile-padding">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
        <tr>
          <td style="text-align:center;">
            <div style="background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%);padding:24px 32px;border-radius:12px;">
              <div style="color:#1e3a8a;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">Welcome Aboard</div>
              <h1 style="margin:0 0 8px 0;font-size:28px;color:#1e293b;font-weight:700;line-height:1.2;">Hello, ${data.employeeName}!</h1>
              <p style="margin:0;color:#475569;font-size:15px;line-height:1.6;">
                We're thrilled to welcome you to <strong style="color:#1e3a8a;">${companyName}</strong>. Your account has been successfully created.
              </p>
            </div>
          </td>
        </tr>
      </table>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
        <tr>
          <td class="card" style="padding:24px 28px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:18px;">
              <tr>
                <td style="width:38px;height:38px;background:linear-gradient(135deg,#3b82f6 0%,#1e40af 100%);border-radius:10px;text-align:center;vertical-align:middle;">
                  <span style="color:#ffffff;font-size:18px;">👤</span>
                </td>
                <td style="padding-left:14px;">
                  <div style="color:#1e293b;font-size:18px;font-weight:700;">Employee Information</div>
                  <div style="color:#6b7280;font-size:13px;margin-top:2px;">Your official employment details</div>
                </td>
              </tr>
            </table>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="info-table">
              <tr>
                <td class="label-cell">Employee Name</td>
                <td class="value-cell">${data.employeeName}</td>
              </tr>
              <tr>
                <td class="label-cell">Employee ID</td>
                <td class="value-cell" style="font-family:'Courier New',monospace;">${data.employeeId}</td>
              </tr>
              <tr>
                <td class="label-cell">Email Address</td>
                <td class="value-cell">${data.email}</td>
              </tr>
              <tr>
                <td class="label-cell">Department</td>
                <td class="value-cell">${data.department || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label-cell">Designation / Position</td>
                <td class="value-cell">${data.designation || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label-cell">Role</td>
                <td class="value-cell">
                  <span style="background-color:#dbeafe;color:#1e40af;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">${data.role}</span>
                </td>
              </tr>
              <tr>
                <td class="label-cell">Manager Name</td>
                <td class="value-cell">${data.managerName || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label-cell">Reporting Manager</td>
                <td class="value-cell">${data.reportingManager || data.managerName || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label-cell">Salary</td>
                <td class="value-cell">${formatCurrency(data.salary)}</td>
              </tr>
              <tr>
                <td class="label-cell">Joining Date</td>
                <td class="value-cell">${formatDate(data.joiningDate)}</td>
              </tr>
              <tr>
                <td class="label-cell">Employment Type</td>
                <td class="value-cell">${data.employmentType || 'Full-Time'}</td>
              </tr>
              <tr>
                <td class="label-cell">Office Location</td>
                <td class="value-cell">${data.officeLocation || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label-cell">Phone Number</td>
                <td class="value-cell">${data.phoneNumber || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label-cell">Shift</td>
                <td class="value-cell">${data.shift || 'General'}</td>
              </tr>
              <tr>
                <td class="label-cell">Working Hours</td>
                <td class="value-cell">${data.workingHours || '9:00 AM - 6:00 PM'}</td>
              </tr>
              <tr>
                <td class="label-cell">Employee Status</td>
                <td class="value-cell">
                  <span style="background-color:#dcfce7;color:#166534;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">
                    ${data.employeeStatus || 'Active'}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
        <tr>
          <td class="login-box" style="padding:24px 28px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:18px;">
              <tr>
                <td style="width:38px;height:38px;background-color:#ffffff;border-radius:10px;text-align:center;vertical-align:middle;">
                  <span style="color:#1e40af;font-size:18px;">🔐</span>
                </td>
                <td style="padding-left:14px;">
                  <div style="color:#1e3a8a;font-size:18px;font-weight:700;">Your Login Credentials</div>
                  <div style="color:#475569;font-size:13px;margin-top:2px;">Access the ${companyName} Employee Portal</div>
                </td>
              </tr>
            </table>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#ffffff;border-radius:10px;overflow:hidden;">
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #dbeafe;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="width:110px;">
                        <div style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Portal</div>
                      </td>
                      <td>
                        <div style="color:#1e3a8a;font-size:14px;font-weight:700;">${companyName} Employee Portal</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #dbeafe;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="width:110px;">
                        <div style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Email</div>
                      </td>
                      <td>
                        <div style="color:#1e293b;font-size:14px;font-weight:600;font-family:'Courier New',monospace;">${data.email}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #dbeafe;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="width:110px;">
                        <div style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Temporary Password</div>
                      </td>
                      <td>
                        <div style="background-color:#f1f5f9;border:1px dashed #cbd5e1;border-radius:6px;padding:8px 12px;display:inline-block;color:#1e293b;font-size:15px;font-weight:700;font-family:'Courier New',monospace;letter-spacing:1px;">
                          ${data.temporaryPassword}
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="width:110px;">
                        <div style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Login URL</div>
                      </td>
                      <td>
                        <a href="${loginUrl}" target="_blank" style="color:#2563eb;font-size:14px;font-weight:600;text-decoration:underline;">
                          ${loginUrl}
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:22px;">
              <tr>
                <td align="center">
                  <a href="${loginUrl}" target="_blank" class="btn-primary">
                    Login to Your Account →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:8px;">
        <tr>
          <td class="security-box" style="padding:22px 26px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:14px;">
              <tr>
                <td style="width:34px;height:34px;background-color:#ffffff;border-radius:10px;text-align:center;vertical-align:middle;">
                  <span style="color:#d97706;font-size:16px;">⚠️</span>
                </td>
                <td style="padding-left:12px;">
                  <div style="color:#92400e;font-size:16px;font-weight:700;">Important Security Instructions</div>
                </td>
              </tr>
            </table>
            <ul style="margin:0;padding-left:22px;">
              <li style="color:#78350f;font-size:14px;line-height:1.8;margin-bottom:6px;">
                Please login using the credentials provided above.
              </li>
              <li style="color:#78350f;font-size:14px;line-height:1.8;margin-bottom:6px;">
                <strong>Change your password immediately after your first login.</strong>
              </li>
              <li style="color:#78350f;font-size:14px;line-height:1.8;margin-bottom:0;">
                Do not share your password with anyone, including IT staff.
              </li>
            </ul>
          </td>
        </tr>
      </table>
    </div>
  `;

  return generateBaseEmailLayout(bodyContent, {
    title: `Welcome to ${companyName}`,
    subtitle: 'Your account has been created successfully',
  });
};

export const generateEmployeeWelcomeSubject = (): string => {
  return `Welcome to ${env.COMPANY_NAME} - Your Account Details`;
};
