#!/usr/bin/env python3
"""
简单的图标生成脚本
使用 PIL/Pillow 库生成 Chrome 扩展所需的图标
"""

try:
    from PIL import Image, ImageDraw
    
    def create_icon(size):
        # 创建图像
        img = Image.new('RGB', (size, size), color='#667eea')
        draw = ImageDraw.Draw(img)
        
        # 绘制渐变背景（简化版）
        for y in range(size):
            r = int(102 + (118 - 102) * y / size)
            g = int(126 + (75 - 126) * y / size)
            b = int(234 + (162 - 234) * y / size)
            draw.line([(0, y), (size, y)], fill=(r, g, b))
        
        # 绘制白色文档图标
        padding = int(size * 0.2)
        icon_size = size - padding * 2
        
        # 文档主体
        points = [
            (padding, padding),
            (padding + int(icon_size * 0.7), padding),
            (padding + icon_size, padding + int(icon_size * 0.3)),
            (padding + icon_size, padding + icon_size),
            (padding, padding + icon_size)
        ]
        draw.polygon(points, fill='white')
        
        # 折角
        fold_points = [
            (padding + int(icon_size * 0.7), padding),
            (padding + icon_size, padding + int(icon_size * 0.3)),
            (padding + int(icon_size * 0.7), padding + int(icon_size * 0.3))
        ]
        draw.polygon(fold_points, fill='#e0e0e0')
        
        # 文本线条
        line_width = max(1, size // 32)
        line_start = padding + int(icon_size * 0.15)
        line_end = padding + int(icon_size * 0.85)
        line_y1 = padding + int(icon_size * 0.45)
        line_y2 = padding + int(icon_size * 0.6)
        line_y3 = padding + int(icon_size * 0.75)
        
        draw.line([(line_start, line_y1), (line_end, line_y1)], fill='#667eea', width=line_width)
        draw.line([(line_start, line_y2), (line_end, line_y2)], fill='#667eea', width=line_width)
        draw.line([(line_start, line_y3), (int(line_end * 0.7), line_y3)], fill='#667eea', width=line_width)
        
        # 保存图标
        img.save(f'icon{size}.png')
        print(f'✓ 创建 icon{size}.png')
    
    # 生成所有尺寸的图标
    sizes = [16, 48, 128]
    for size in sizes:
        create_icon(size)
    
    print('\n✅ 所有图标创建成功！')

except ImportError:
    print('❌ 错误：需要安装 Pillow 库')
    print('请运行: pip install Pillow')
    print('\n或者使用 create_icons.html 在浏览器中生成图标')
