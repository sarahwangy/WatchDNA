'use client';

// nivo/sankey 只能在浏览器里运行，必须加 'use client'
// 如果在服务器端渲染会报 "window is not defined"
import { ResponsiveSankey } from '@nivo/sankey';
import type { SankeyData } from '@/lib/queries/sankey';

interface SubscriptionSankeyProps {
  data: SankeyData;
}

export function SubscriptionSankey({ data }: SubscriptionSankeyProps) {
  // 没有数据时说明 AI 分类还没跑，显示引导提示
  if (data.nodes.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
        <p className="text-zinc-400 text-sm">
          The Sankey chart requires AI classification data. Please go to the{' '}
          <a href="/insights" className="text-red-400 hover:text-red-300 underline">
            AI Insights page
          </a>{' '}
          to generate classifications first.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-zinc-400">Subscriptions vs Actual Watches</h3>
        <p className="text-xs text-zinc-600 mt-1">
          Left: subscribed channels · Right: actual watch count · line width = watch volume
        </p>
      </div>

      {/* nivo 图表必须给固定高度，不然渲染不出来 */}
      <div style={{ height: 400 }}>
        <ResponsiveSankey
          data={data}
          margin={{ top: 16, right: 120, bottom: 16, left: 120 }}
          align="justify"
          colors={{ datum: 'color' }}
          nodeOpacity={1}
          nodeThickness={18}
          nodeSpacing={24}
          nodeBorderWidth={0}
          nodeBorderColor={{ from: 'color', modifiers: [['darker', 0.8]] }}
          linkOpacity={0.4}
          linkHoverOpacity={0.7}
          linkContract={3}
          enableLinkGradient
          labelPosition="outside"
          labelOrientation="horizontal"
          labelPadding={12}
          labelTextColor={{ from: 'color', modifiers: [['brighter', 1]] }}
          theme={{
            background: 'transparent',
            text: {
              fill: '#a1a1aa',
              fontSize: 11,
              fontFamily: 'Inter, sans-serif',
            },
            tooltip: {
              container: {
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: 8,
                color: '#fff',
                fontSize: 12,
              },
            },
          }}
          nodeTooltip={({ node }) => (
            <div style={{ padding: '8px 12px', fontSize: 12 }}>
              <strong>{node.label}</strong>
            </div>
          )}
          linkTooltip={({ link }) => (
            <div style={{ padding: '8px 12px', fontSize: 12 }}>
              {(link.source as { label: string }).label?.split('\n')[0]} →{' '}
              {(link.target as { label: string }).label?.split('\n')[0]}
              <br />
              <span style={{ color: '#a1a1aa' }}>{link.value} views</span>
            </div>
          )}
        />
      </div>

      <div style={{ display: 'flex', gap: 24, marginTop: 12, fontSize: 12, color: '#71717a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: '#52525b' }} />
          Left = subscribed channels
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 2, background: '#52525b' }} />
          Right = actual watch count
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 24, height: 2, background: '#52525b' }} />
          Line width = watch volume
        </div>
      </div>
    </div>
  );
}
