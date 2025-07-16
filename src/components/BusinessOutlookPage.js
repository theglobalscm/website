import React from 'react';
import { useTranslation } from 'react-i18next';

function BusinessOutlookPage({ businessOutlookContent }) {
  const { t } = useTranslation();

  if (!businessOutlookContent) {
    return <div className="text-center py-20 text-xl text-gray-600">{t('loading_content')}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">{t('business_outlook')}</h1>

      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6 text-blue-800">{t('admin_business_outlook_scope_title')}</h2>
        {businessOutlookContent.businessScopeItems && businessOutlookContent.businessScopeItems.map((item, index) => (
          <div key={index} className="flex flex-wrap items-center mb-8 bg-white p-6 rounded-lg shadow-md">
            {item.imageUrl && (
              <div className="w-full md:w-1/3 p-2">
                <img src={item.imageUrl} alt={item.title} className="rounded-lg shadow-sm w-full h-auto object-cover" onError={(e) => e.target.src = 'https://placehold.co/300x200/add8e6/000000?text=Image+Error'}/>
              </div>
            )}
            <div className={`w-full ${item.imageUrl ? 'md:w-2/3' : ''} p-2`}>
              <h3 className="text-2xl font-semibold text-gray-800 mb-3">{item.title}</h3>
              {item.text && <p className="text-gray-700 mb-2">{item.text}</p>}
              {item.points && item.points.length > 0 && (
                <ul className="list-disc list-inside text-gray-600">
                  {item.points.map((point, pIndex) => <li key={pIndex}>{point}</li>)}
                </ul>
              )}
            </div>
          </div>
        ))}
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6 text-blue-800">{t('admin_business_outlook_expansion_title')}</h2>
        {businessOutlookContent.businessExpansionItems && businessOutlookContent.businessExpansionItems.map((item, index) => (
          <div key={index} className="mb-8 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-2xl font-semibold text-gray-800 mb-3">{item.title}</h3>
            {item.text && <p className="text-gray-700 mb-2">{item.text}</p>}
            {item.points && item.points.length > 0 && (
              <ul className="list-disc list-inside text-gray-600">
                {item.points.map((point, pIndex) => <li key={pIndex}>{point}</li>)}
              </ul>
            )}
          </div>
        ))}
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6 text-blue-800">{t('admin_business_outlook_financial_revenue_title')}</h2>
        <div className="overflow-x-auto mb-8">
          <table className="min-w-full bg-white rounded-lg shadow-md">
            <thead>
              <tr className="bg-blue-100 text-blue-800">
                <th className="py-2 px-3 text-left">{t('admin_business_outlook_year_column')}</th>
                <th className="py-2 px-3 text-left">{t('admin_business_outlook_revenue_column')}</th>
                <th className="py-2 px-3 text-left">{t('admin_business_outlook_sales_column')}</th>
                <th className="py-2 px-3 text-left">{t('admin_business_outlook_gross_profit_column')}</th>
              </tr>
            </thead>
            <tbody>
              {businessOutlookContent.financialForecast.revenueTable && businessOutlookContent.financialForecast.revenueTable.map((row, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-2 px-3 text-gray-700">{row.year}</td>
                  <td className="py-2 px-3 text-gray-700">{row.revenue}</td>
                  <td className="py-2 px-3 text-gray-700">{row.sales}</td>
                  <td className="py-2 px-3 text-gray-700">{row.grossProfit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6 text-blue-800">{t('admin_business_outlook_financial_cost_title')}</h2>
        {businessOutlookContent.financialForecast.costAssumptions && businessOutlookContent.financialForecast.costAssumptions.map((assumption, index) => (
          <div key={index} className="mb-6 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-2xl font-semibold text-gray-800 mb-3">{assumption.type}</h3>
            <ul className="list-disc list-inside text-gray-600">
              {assumption.details.map((detail, dIndex) => <li key={dIndex}>{detail}</li>)}
            </ul>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-3xl font-bold mb-6 text-blue-800">{t('admin_business_outlook_investment_opportunity_label')}</h2>
        <p className="text-lg text-gray-700 bg-white p-6 rounded-lg shadow-md">{businessOutlookContent.financialForecast.investmentOpportunity}</p>
      </section>
    </div>
  );
}

export default BusinessOutlookPage;